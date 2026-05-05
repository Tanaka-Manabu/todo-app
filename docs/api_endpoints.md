# APIエンドポイント一覧

**バージョン:** 1.0  
**作成日:** 2026-05-05  
**ベースURL:** `https://api.example.com/v1`  
**認証:** Bearer Token（JWT）※ 🔒 マークのエンドポイントは認証必須

---

## 1. 認証 `/auth`

| メソッド | パス | 説明 | 認証 |
|----------|------|------|------|
| POST | `/auth/register` | 新規ユーザー登録 | — |
| POST | `/auth/login` | ログイン（JWTを返す） | — |
| POST | `/auth/logout` | ログアウト（リフレッシュトークン無効化） | 🔒 |
| POST | `/auth/refresh` | アクセストークン再発行 | — |
| POST | `/auth/password/reset-request` | パスワードリセットメール送信 | — |
| POST | `/auth/password/reset` | パスワードリセット実行 | — |
| GET | `/auth/verify-email` | メールアドレス認証 | — |

### リクエスト/レスポンス例

**POST /auth/register**
```json
// Request
{
  "email": "user@example.com",
  "password": "Password123",
  "display_name": "田中"
}

// Response 201
{
  "message": "確認メールを送信しました"
}
```

**POST /auth/login**
```json
// Request
{
  "email": "user@example.com",
  "password": "Password123"
}

// Response 200
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

---

## 2. ユーザー `/users`

| メソッド | パス | 説明 | 認証 |
|----------|------|------|------|
| GET | `/users/me` | 自分のプロフィール取得 | 🔒 |
| PATCH | `/users/me` | プロフィール更新 | 🔒 |
| DELETE | `/users/me` | アカウント削除（論理削除） | 🔒 |
| PUT | `/users/me/password` | パスワード変更 | 🔒 |

---

## 3. カテゴリ `/categories`

| メソッド | パス | 説明 | 認証 |
|----------|------|------|------|
| GET | `/categories` | カテゴリ一覧取得 | 🔒 |
| POST | `/categories` | カテゴリ作成 | 🔒 |
| GET | `/categories/{id}` | カテゴリ詳細取得 | 🔒 |
| PATCH | `/categories/{id}` | カテゴリ更新 | 🔒 |
| DELETE | `/categories/{id}` | カテゴリ削除 | 🔒 |

### リクエスト/レスポンス例

**GET /categories**
```json
// Response 200
{
  "categories": [
    {
      "id": 1,
      "name": "仕事",
      "color": "#4A90E2",
      "sort_order": 0,
      "task_count": 5
    }
  ]
}
```

**POST /categories**
```json
// Request
{
  "name": "仕事",
  "color": "#4A90E2"
}

// Response 201
{
  "id": 1,
  "name": "仕事",
  "color": "#4A90E2",
  "sort_order": 0,
  "created_at": "2026-05-05T09:00:00Z"
}
```

---

## 4. タグ `/tags`

| メソッド | パス | 説明 | 認証 |
|----------|------|------|------|
| GET | `/tags` | タグ一覧取得 | 🔒 |
| POST | `/tags` | タグ作成 | 🔒 |
| DELETE | `/tags/{id}` | タグ削除 | 🔒 |

---

## 5. タスク `/tasks`

| メソッド | パス | 説明 | 認証 |
|----------|------|------|------|
| GET | `/tasks` | タスク一覧取得（フィルタ・ソート対応） | 🔒 |
| POST | `/tasks` | タスク作成 | 🔒 |
| GET | `/tasks/{id}` | タスク詳細取得 | 🔒 |
| PATCH | `/tasks/{id}` | タスク更新 | 🔒 |
| DELETE | `/tasks/{id}` | タスク削除（論理削除） | 🔒 |
| PATCH | `/tasks/{id}/complete` | タスク完了 | 🔒 |
| PATCH | `/tasks/{id}/restore` | タスク復元（完了→未完了 or 削除→復元） | 🔒 |
| GET | `/tasks/{id}/subtasks` | サブタスク一覧取得 | 🔒 |
| POST | `/tasks/{id}/subtasks` | サブタスク作成 | 🔒 |
| POST | `/tasks/{id}/tags` | タスクにタグ付与 | 🔒 |
| DELETE | `/tasks/{id}/tags/{tag_id}` | タスクからタグ削除 | 🔒 |

### クエリパラメータ（GET /tasks）

| パラメータ | 型 | 説明 | 例 |
|-----------|----|----|-----|
| status | string | ステータスフィルタ | `todo`, `in_progress`, `done`, `deleted` |
| priority | string | 優先度フィルタ | `high`, `medium`, `low` |
| category_id | integer | カテゴリフィルタ | `1` |
| tag_id | integer | タグフィルタ | `2` |
| due_before | datetime | 期限（〜以前） | `2026-05-31T23:59:59Z` |
| due_after | datetime | 期限（〜以降） | `2026-05-01T00:00:00Z` |
| overdue | boolean | 期限切れのみ | `true` |
| q | string | キーワード検索 | `買い物` |
| sort | string | ソートキー | `due_date`, `priority`, `created_at`, `updated_at` |
| order | string | ソート順 | `asc`, `desc` |
| page | integer | ページ番号 | `1` |
| per_page | integer | 1ページあたり件数（最大100） | `20` |

### リクエスト/レスポンス例

**GET /tasks**
```json
// Response 200
{
  "tasks": [
    {
      "id": 1,
      "title": "企画書を作成する",
      "description": "Q3の新規企画書",
      "status": "todo",
      "priority": "high",
      "due_date": "2026-05-10T18:00:00Z",
      "category": { "id": 1, "name": "仕事", "color": "#4A90E2" },
      "tags": [{ "id": 2, "name": "急ぎ" }],
      "subtask_count": 3,
      "subtask_completed_count": 1,
      "created_at": "2026-05-05T09:00:00Z",
      "updated_at": "2026-05-05T09:00:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "per_page": 20,
    "total_pages": 3
  }
}
```

**POST /tasks**
```json
// Request
{
  "title": "企画書を作成する",
  "description": "Q3の新規企画書",
  "priority": "high",
  "due_date": "2026-05-10T18:00:00Z",
  "category_id": 1,
  "tag_ids": [2]
}

// Response 201
{
  "id": 1,
  "title": "企画書を作成する",
  ...
}
```

---

## 6. データ連携 `/export` `/import`

| メソッド | パス | 説明 | 認証 |
|----------|------|------|------|
| GET | `/tasks/export` | タスクをCSVエクスポート | 🔒 |
| POST | `/tasks/import` | タスクをCSVインポート | 🔒 |

**GET /tasks/export** — クエリパラメータは GET /tasks と同じフィルタを使用  
**レスポンス:** `Content-Type: text/csv` でCSVファイルを返す

---

## 7. 通知 `/notifications`

| メソッド | パス | 説明 | 認証 |
|----------|------|------|------|
| GET | `/notifications` | 通知一覧取得 | 🔒 |
| PATCH | `/notifications/{id}/read` | 通知を既読にする | 🔒 |

---

## 8. 共通仕様

### 8.1 エラーレスポンス

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値が不正です",
    "details": [
      { "field": "email", "message": "有効なメールアドレスを入力してください" }
    ]
  }
}
```

### 8.2 HTTPステータスコード

| コード | 用途 |
|--------|------|
| 200 | 成功（GET / PATCH） |
| 201 | 作成成功（POST） |
| 204 | 削除成功（DELETE） |
| 400 | バリデーションエラー |
| 401 | 未認証（トークン無効・期限切れ） |
| 403 | 権限エラー（他ユーザーのリソースへのアクセス） |
| 404 | リソースが見つからない |
| 429 | レートリミット超過 |
| 500 | サーバー内部エラー |

### 8.3 ページネーション

全一覧APIは `page` / `per_page` によるオフセットページネーションを採用。  
デフォルト: `page=1`, `per_page=20`、上限: `per_page=100`

### 8.4 日時フォーマット

全日時は ISO 8601 UTC 形式（例: `2026-05-05T09:00:00Z`）で返す。
