# DBスキーマ設計書

**バージョン:** 1.0  
**作成日:** 2026-05-05  
**DB:** MySQL 8.0 / ORM: SQLAlchemy / マイグレーション: Alembic

---

## 1. ER図

```
users
  │
  ├──< categories
  │
  ├──< tasks
  │     ├──< tasks (self: parent_id / サブタスク)
  │     ├──< task_tags >── tags
  │     └──< notifications
  │
  └──< tags
```

---

## 2. テーブル定義

### 2.1 users（ユーザー）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|----|------|-----------|------|
| id | BIGINT UNSIGNED | NO | AUTO_INCREMENT | PK |
| email | VARCHAR(255) | NO | — | メールアドレス（一意） |
| password_hash | VARCHAR(255) | NO | — | bcryptハッシュ |
| display_name | VARCHAR(100) | NO | — | 表示名 |
| avatar_url | VARCHAR(500) | YES | NULL | アバター画像URL |
| is_active | TINYINT(1) | NO | 0 | メール認証済みフラグ |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | DATETIME | NO | CURRENT_TIMESTAMP | 更新日時（ON UPDATE） |
| deleted_at | DATETIME | YES | NULL | 論理削除日時 |

**インデックス:**
- `UNIQUE (email)`
- `INDEX (deleted_at)`

---

### 2.2 categories（カテゴリ）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|----|------|-----------|------|
| id | BIGINT UNSIGNED | NO | AUTO_INCREMENT | PK |
| user_id | BIGINT UNSIGNED | NO | — | FK → users.id |
| name | VARCHAR(100) | NO | — | カテゴリ名 |
| color | VARCHAR(7) | YES | NULL | 表示色（例: #FF5733） |
| sort_order | INT | NO | 0 | 表示順 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | DATETIME | NO | CURRENT_TIMESTAMP | 更新日時 |
| deleted_at | DATETIME | YES | NULL | 論理削除日時 |

**インデックス:**
- `INDEX (user_id)`
- `INDEX (user_id, deleted_at)`

---

### 2.3 tasks（タスク）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|----|------|-----------|------|
| id | BIGINT UNSIGNED | NO | AUTO_INCREMENT | PK |
| user_id | BIGINT UNSIGNED | NO | — | FK → users.id |
| parent_id | BIGINT UNSIGNED | YES | NULL | FK → tasks.id（サブタスク用） |
| category_id | BIGINT UNSIGNED | YES | NULL | FK → categories.id |
| title | VARCHAR(255) | NO | — | タスクタイトル |
| description | TEXT | YES | NULL | 詳細説明 |
| status | ENUM('todo','in_progress','done','deleted') | NO | 'todo' | ステータス |
| priority | ENUM('high','medium','low') | NO | 'medium' | 優先度 |
| due_date | DATETIME | YES | NULL | 期限日時 |
| completed_at | DATETIME | YES | NULL | 完了日時 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | DATETIME | NO | CURRENT_TIMESTAMP | 更新日時 |
| deleted_at | DATETIME | YES | NULL | 論理削除日時 |

**インデックス:**
- `INDEX (user_id, status, deleted_at)` — 一覧取得用
- `INDEX (user_id, due_date)` — 期限ソート用
- `INDEX (parent_id)` — サブタスク取得用
- `INDEX (category_id)`
- `FULLTEXT (title, description)` — キーワード検索用

**外部キー制約:**
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- `FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE`
- `FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL`

---

### 2.4 tags（タグ）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|----|------|-----------|------|
| id | BIGINT UNSIGNED | NO | AUTO_INCREMENT | PK |
| user_id | BIGINT UNSIGNED | NO | — | FK → users.id |
| name | VARCHAR(50) | NO | — | タグ名 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |

**インデックス:**
- `UNIQUE (user_id, name)`

---

### 2.5 task_tags（タスク-タグ 中間テーブル）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|----|------|-----------|------|
| task_id | BIGINT UNSIGNED | NO | — | FK → tasks.id |
| tag_id | BIGINT UNSIGNED | NO | — | FK → tags.id |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 紐付け日時 |

**主キー:** `PRIMARY KEY (task_id, tag_id)`

**外部キー制約:**
- `FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE`
- `FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE`

---

### 2.6 notifications（通知）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|----|------|-----------|------|
| id | BIGINT UNSIGNED | NO | AUTO_INCREMENT | PK |
| user_id | BIGINT UNSIGNED | NO | — | FK → users.id |
| task_id | BIGINT UNSIGNED | YES | NULL | FK → tasks.id |
| type | ENUM('due_reminder','overdue') | NO | — | 通知種別 |
| is_sent | TINYINT(1) | NO | 0 | 送信済みフラグ |
| scheduled_at | DATETIME | NO | — | 通知予定日時 |
| sent_at | DATETIME | YES | NULL | 送信日時 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |

**インデックス:**
- `INDEX (scheduled_at, is_sent)` — バッチ処理用

---

### 2.7 password_reset_tokens（パスワードリセットトークン）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|----|------|-----------|------|
| id | BIGINT UNSIGNED | NO | AUTO_INCREMENT | PK |
| user_id | BIGINT UNSIGNED | NO | — | FK → users.id |
| token | VARCHAR(255) | NO | — | ランダムトークン（SHA-256ハッシュで保管） |
| expires_at | DATETIME | NO | — | 有効期限（発行から60分） |
| used_at | DATETIME | YES | NULL | 使用日時 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |

**インデックス:**
- `UNIQUE (token)`
- `INDEX (expires_at)`

---

## 3. 共通設計方針

- 全テーブルで `created_at` / `updated_at` を持つ
- 削除は `deleted_at` による論理削除（tasks・categories・users）
- 文字コード: `utf8mb4` / 照合順序: `utf8mb4_unicode_ci`
- タイムゾーン: UTC で保管し、アプリ層で JST 変換
