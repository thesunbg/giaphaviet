"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileJson, AlertTriangle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jsonContent, setJsonContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    stats?: { totalMembers: number; totalRelationships: number; totalMarriages: number };
  } | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Vui lòng chọn file .json");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setJsonContent(text);
      setResult(null);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!jsonContent.trim()) {
      toast.error("Vui lòng chọn file JSON hoặc dán nội dung JSON");
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      toast.error("Nội dung JSON không hợp lệ");
      return;
    }

    if (
      !confirm(
        "Import sẽ XÓA toàn bộ dữ liệu hiện tại và thay thế bằng dữ liệu mới. Bạn có chắc chắn?"
      )
    ) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, message: data.message, stats: data.stats });
        toast.success("Import thành công!");
      } else {
        setResult({ success: false, message: data.error });
        toast.error(data.error);
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi import");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Import Gia Phả từ JSON</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upload Section */}
        <div className="space-y-4">
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Chọn file JSON
            </h2>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-[#8b4513] hover:bg-[#8b4513]/5"
            >
              <Upload className="mb-3 h-10 w-10 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">
                Click để chọn file .json
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Hoặc dán nội dung JSON vào ô bên dưới
              </p>
            </div>

            {fileName && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                <FileJson className="h-4 w-4" />
                {fileName}
              </div>
            )}

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Hoặc dán nội dung JSON:
              </label>
              <textarea
                value={jsonContent}
                onChange={(e) => {
                  setJsonContent(e.target.value);
                  setResult(null);
                }}
                className="h-64 w-full rounded-lg border border-gray-300 p-3 font-mono text-xs focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                placeholder='{"familyName": "Họ Nguyễn", "root": { ... }}'
              />
            </div>

            <div className="mt-4 flex gap-3">
              <Button onClick={handleImport} disabled={loading || !jsonContent.trim()}>
                {loading ? "Đang import..." : "Import Gia Phả"}
              </Button>
              {result?.success && (
                <Button
                  variant="outline"
                  onClick={() => router.push("/gia-pha")}
                >
                  Xem Cây Gia Phả
                </Button>
              )}
            </div>

            {/* Result */}
            {result && (
              <div
                className={`mt-4 rounded-lg p-4 ${
                  result.success
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <p className="font-medium">{result.message}</p>
                </div>
                {result.stats && (
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-bold text-2xl">{result.stats.totalMembers}</p>
                      <p className="text-green-600">Thành viên</p>
                    </div>
                    <div>
                      <p className="font-bold text-2xl">{result.stats.totalRelationships}</p>
                      <p className="text-green-600">Quan hệ cha-con</p>
                    </div>
                    <div>
                      <p className="font-bold text-2xl">{result.stats.totalMarriages}</p>
                      <p className="text-green-600">Hôn nhân</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Format Guide */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Hướng dẫn cấu trúc JSON
          </h2>
          <div className="rounded-lg bg-gray-900 p-4 text-xs text-green-400 font-mono overflow-x-auto">
            <pre>{`{
  "familyName": "Họ Nguyễn",
  "root": {
    "fullName": "Nguyễn Văn A",
    "gender": "male",
    "generation": 1,
    "birthOrder": 1,
    "birthDate": "1900",
    "isAlive": false,
    "deathDate": "1975",
    "occupation": "Nông dân",
    "notes": "Cụ tổ dòng họ",
    "spouses": [
      {
        "fullName": "Trần Thị B",
        "gender": "female",
        "isAlive": false,
        "orderIndex": 1
      }
    ],
    "children": [
      {
        "fullName": "Nguyễn Văn C",
        "gender": "male",
        "generation": 2,
        "birthOrder": 1,
        "spouses": [...],
        "children": [...]
      }
    ]
  }
}`}</pre>
          </div>

          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500 shrink-0" />
              <p>
                <strong>Lưu ý:</strong> Import sẽ xóa toàn bộ dữ liệu cũ và thay thế bằng
                dữ liệu mới.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">Các trường cho mỗi thành viên:</p>
              <ul className="list-disc pl-5 space-y-0.5">
                <li><code className="text-xs bg-gray-100 px-1 rounded">fullName</code> (bắt buộc): Họ tên</li>
                <li><code className="text-xs bg-gray-100 px-1 rounded">gender</code> (bắt buộc): &quot;male&quot; hoặc &quot;female&quot;</li>
                <li><code className="text-xs bg-gray-100 px-1 rounded">generation</code>: Đời thứ mấy</li>
                <li><code className="text-xs bg-gray-100 px-1 rounded">birthOrder</code>: Con thứ mấy</li>
                <li><code className="text-xs bg-gray-100 px-1 rounded">birthDate</code>: Năm sinh</li>
                <li><code className="text-xs bg-gray-100 px-1 rounded">deathDate</code>: Năm mất</li>
                <li><code className="text-xs bg-gray-100 px-1 rounded">isAlive</code>: true/false</li>
                <li><code className="text-xs bg-gray-100 px-1 rounded">occupation</code>: Nghề nghiệp</li>
                <li><code className="text-xs bg-gray-100 px-1 rounded">address</code>: Nơi ở</li>
                <li><code className="text-xs bg-gray-100 px-1 rounded">biography</code>: Tiểu sử</li>
                <li><code className="text-xs bg-gray-100 px-1 rounded">notes</code>: Ghi chú</li>
                <li><code className="text-xs bg-gray-100 px-1 rounded">spouses</code>: Mảng vợ/chồng</li>
                <li><code className="text-xs bg-gray-100 px-1 rounded">children</code>: Mảng con (đệ quy)</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
