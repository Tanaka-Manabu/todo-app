"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "../components/DatePicker";

type Priority = "high" | "medium" | "low";
type Category = { id: number; name: string; color: string | null };
type Task = {
  id: number;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: Priority;
  due_date: string | null;
  category_id: number | null;
};

const PRIORITY_LABEL: Record<Priority, string> = { high: "高", medium: "中", low: "低" };
const PRIORITY_COLOR: Record<Priority, string> = {
  high: "text-red-600 bg-red-50",
  medium: "text-yellow-600 bg-yellow-50",
  low: "text-gray-500 bg-gray-100",
};
const DEFAULT_COLORS = ["#4A90E2", "#E24A4A", "#4AE27A", "#E2C34A", "#9B4AE2", "#4AE2D8"];

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = d < today;
  const label = `${d.getMonth() + 1}/${d.getDate()}`;
  return { label, isOverdue };
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(DEFAULT_COLORS[0]);

  const emptyForm = { title: "", priority: "medium" as Priority, due_date: "", category_id: "" };
  const [form, setForm] = useState(emptyForm);

  const [token, setToken] = useState<string | null>(null);
  const authHeader = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { ...authHeader, "Content-Type": "application/json" };

  useEffect(() => {
    const t = localStorage.getItem("access_token");
    if (!t) { router.push("/login"); return; }
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;
    Promise.all([fetchTasks(), fetchCategories()]);
  }, [token]);

  const fetchTasks = async () => {
    setLoading(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, { headers: authHeader });
    if (res.status === 401) { router.push("/login"); return; }
    if (res.ok) setTasks((await res.json()).tasks ?? []);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, { headers: authHeader });
    if (res.ok) setCategories(await res.json());
  };

  const openAdd = () => { setForm(emptyForm); setShowAddModal(true); };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      priority: task.priority,
      due_date: task.due_date ? task.due_date.slice(0, 10) : "",
      category_id: task.category_id ? String(task.category_id) : "",
    });
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        title: form.title,
        priority: form.priority,
        due_date: form.due_date || null,
        category_id: form.category_id ? Number(form.category_id) : null,
      }),
    });
    if (res.ok) { await fetchTasks(); setShowAddModal(false); }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTask) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${editTask.id}`, {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify({
        title: form.title,
        priority: form.priority,
        due_date: form.due_date || null,
        category_id: form.category_id ? Number(form.category_id) : null,
      }),
    });
    if (res.ok) { await fetchTasks(); setEditTask(null); }
  };

  const toggleComplete = async (task: Task) => {
    const url = task.status === "done"
      ? `${process.env.NEXT_PUBLIC_API_URL}/tasks/${task.id}/restore`
      : `${process.env.NEXT_PUBLIC_API_URL}/tasks/${task.id}/complete`;
    const res = await fetch(url, { method: "PATCH", headers: authHeader });
    if (res.ok) fetchTasks();
  };

  const deleteTask = async () => {
    if (deleteTaskId === null) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${deleteTaskId}`, { method: "DELETE", headers: authHeader });
    if (res.ok) { setTasks((p) => p.filter((t) => t.id !== deleteTaskId)); setDeleteTaskId(null); }
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ name: newCategoryName, color: newCategoryColor }),
    });
    if (res.ok) { await fetchCategories(); setNewCategoryName(""); setShowCategoryModal(false); }
  };

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const todoTasks = tasks.filter((t) => t.status !== "done");
  const doneTasks = tasks.filter((t) => t.status === "done");

  const TaskForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4" onKeyDown={(e) => { if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "BUTTON") e.preventDefault(); }}>
      <Field label="タスク名">
        <input type="text" required autoFocus value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="例：企画書を作成する" className={inputCls} />
      </Field>
      <Field label="優先度">
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })} className={inputCls}>
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
      </Field>
      <Field label="期限">
        <DatePicker
          value={form.due_date}
          onChange={(v) => setForm({ ...form, due_date: v })}
          className={inputCls}
        />
      </Field>
      <Field label="カテゴリ">
        <div className="flex gap-2">
          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={`${inputCls} flex-1`}>
            <option value="">なし</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="button" onClick={() => setShowCategoryModal(true)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 whitespace-nowrap">
            ＋ 新規
          </button>
        </div>
      </Field>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => { setShowAddModal(false); setEditTask(null); }}
          className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg text-sm hover:bg-gray-50">
          キャンセル
        </button>
        <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm">
          {submitLabel}
        </button>
      </div>
    </form>
  );

  const TaskItem = ({ task, done = false }: { task: Task; done?: boolean }) => {
    const cat = task.category_id ? categoryMap[task.category_id] : null;
    const due = task.due_date ? formatDate(task.due_date) : null;
    return (
      <div className={`bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-start gap-3 ${done ? "opacity-50" : ""}`}>
        <input type="checkbox" checked={done} onChange={() => toggleComplete(task)}
          className="w-4 h-4 accent-blue-600 cursor-pointer mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${done ? "line-through text-gray-400" : "text-gray-800"}`}>{task.title}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLOR[task.priority]}`}>
              {PRIORITY_LABEL[task.priority]}
            </span>
            {cat && (
              <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                style={{ backgroundColor: cat.color ?? "#888" }}>
                {cat.name}
              </span>
            )}
            {due && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${due.isOverdue ? "text-red-600 bg-red-50" : "text-gray-500 bg-gray-100"}`}>
                {due.isOverdue ? "⚠ " : ""}{due.label}
              </span>
            )}
          </div>
        </div>
        {!done && (
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={() => openEdit(task)}
              className="text-xs text-gray-400 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50">編集</button>
            <button onClick={() => setDeleteTaskId(task.id)}
              className="text-xs text-gray-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50">削除</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">TODOリスト</h1>
        <button onClick={() => { localStorage.removeItem("access_token"); router.push("/login"); }}
          className="text-sm text-gray-500 hover:text-gray-800">ログアウト</button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={openAdd}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl text-sm transition-colors mb-8">
          ＋ タスクを追加
        </button>

        {loading ? (
          <p className="text-center text-gray-400 text-sm">読み込み中...</p>
        ) : todoTasks.length === 0 && doneTasks.length === 0 ? (
          <p className="text-center text-gray-400 text-sm mt-16">タスクがありません。「タスクを追加」から始めましょう。</p>
        ) : (
          <div className="space-y-3">
            {todoTasks.map((t) => <TaskItem key={t.id} task={t} />)}
            {doneTasks.length > 0 && (
              <div className="mt-6">
                <p className="text-xs text-gray-400 mb-2 font-medium">完了済み</p>
                <div className="space-y-3">{doneTasks.map((t) => <TaskItem key={t.id} task={t} done />)}</div>
              </div>
            )}
          </div>
        )}
      </main>

      {showAddModal && (
        <Modal title="タスクを追加" onClose={() => setShowAddModal(false)}>
          <TaskForm onSubmit={handleSubmitAdd} submitLabel="追加する" />
        </Modal>
      )}
      {editTask && (
        <Modal title="タスクを編集" onClose={() => setEditTask(null)}>
          <TaskForm onSubmit={handleSubmitEdit} submitLabel="保存する" />
        </Modal>
      )}
      {deleteTaskId !== null && (
        <Modal title="タスクを削除" onClose={() => setDeleteTaskId(null)}>
          <p className="text-sm text-gray-600 mb-6">このタスクを削除しますか？この操作は元に戻せません。</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTaskId(null)}
              className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg text-sm hover:bg-gray-50">キャンセル</button>
            <button onClick={deleteTask}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg text-sm">削除する</button>
          </div>
        </Modal>
      )}
      {showCategoryModal && (
        <Modal title="カテゴリを作成" onClose={() => setShowCategoryModal(false)}>
          <form onSubmit={createCategory} className="space-y-4">
            <Field label="カテゴリ名">
              <input type="text" required autoFocus value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="例：仕事" className={inputCls} />
            </Field>
            <Field label="カラー">
              <div className="flex gap-2 flex-wrap">
                {DEFAULT_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setNewCategoryColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${newCategoryColor === c ? "border-gray-800 scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </Field>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCategoryModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg text-sm hover:bg-gray-50">キャンセル</button>
              <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm">作成する</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

const inputCls = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
