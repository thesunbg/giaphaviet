"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { RELATIONSHIP_TYPES } from "@/lib/constants";
import { Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";

interface MemberOption {
  id: string;
  fullName: string;
  gender: string;
  generation: number;
}

interface Props {
  members: MemberOption[];
  parentChildRelations: Array<{
    id: string;
    relationshipType: string;
    parent: { id: string; fullName: string; gender: string };
    child: { id: string; fullName: string; gender: string };
  }>;
  marriages: Array<{
    id: string;
    marriageDate: string | null;
    orderIndex: number;
    spouse1: { id: string; fullName: string; gender: string };
    spouse2: { id: string; fullName: string; gender: string };
  }>;
}

export function RelationshipManager({
  members,
  parentChildRelations,
  marriages,
}: Props) {
  const router = useRouter();

  // Parent-Child Form
  const [parentId, setParentId] = useState("");
  const [childId, setChildId] = useState("");
  const [relType, setRelType] = useState("biological");
  const [pcLoading, setPcLoading] = useState(false);

  // Marriage Form
  const [spouse1Id, setSpouse1Id] = useState("");
  const [spouse2Id, setSpouse2Id] = useState("");
  const [marriageDate, setMarriageDate] = useState("");
  const [mLoading, setMLoading] = useState(false);

  const memberOptions = members.map((m) => ({
    value: m.id,
    label: `${m.fullName} (Đời ${m.generation})`,
  }));

  async function addParentChild() {
    if (!parentId || !childId) {
      toast.error("Vui lòng chọn cha/mẹ và con");
      return;
    }
    setPcLoading(true);
    try {
      const res = await fetch("/api/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId, childId, relationshipType: relType }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Thêm quan hệ thành công!");
      setParentId("");
      setChildId("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setPcLoading(false);
    }
  }

  async function deleteRelationship(id: string) {
    if (!confirm("Xóa quan hệ này?")) return;
    const res = await fetch(`/api/relationships/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Đã xóa quan hệ");
      router.refresh();
    }
  }

  async function addMarriage() {
    if (!spouse1Id || !spouse2Id) {
      toast.error("Vui lòng chọn cả hai người");
      return;
    }
    setMLoading(true);
    try {
      const res = await fetch("/api/marriages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spouse1Id,
          spouse2Id,
          marriageDate: marriageDate || null,
          orderIndex: 1,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Thêm hôn nhân thành công!");
      setSpouse1Id("");
      setSpouse2Id("");
      setMarriageDate("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setMLoading(false);
    }
  }

  async function deleteMarriage(id: string) {
    if (!confirm("Xóa quan hệ hôn nhân này?")) return;
    const res = await fetch(`/api/marriages/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Đã xóa");
      router.refresh();
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Parent-Child Section */}
      <div className="space-y-4">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Thêm quan hệ Cha/Mẹ - Con</h2>
          <div className="space-y-3">
            <Select
              label="Cha / Mẹ"
              options={memberOptions}
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              placeholder="-- Chọn cha/mẹ --"
            />
            <Select
              label="Con"
              options={memberOptions}
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
              placeholder="-- Chọn con --"
            />
            <Select
              label="Loại quan hệ"
              options={[...RELATIONSHIP_TYPES]}
              value={relType}
              onChange={(e) => setRelType(e.target.value)}
            />
            <Button onClick={addParentChild} disabled={pcLoading} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              {pcLoading ? "Đang thêm..." : "Thêm quan hệ"}
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 font-semibold text-gray-900">
            Danh sách quan hệ Cha/Mẹ - Con ({parentChildRelations.length})
          </h3>
          {parentChildRelations.length === 0 ? (
            <p className="text-sm text-gray-400">Chưa có quan hệ nào</p>
          ) : (
            <div className="space-y-2">
              {parentChildRelations.map((rel) => (
                <div
                  key={rel.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                >
                  <div className="text-sm">
                    <span className="font-medium">{rel.parent.fullName}</span>
                    <span className="mx-2 text-gray-400">&rarr;</span>
                    <span className="font-medium">{rel.child.fullName}</span>
                    {rel.relationshipType !== "biological" && (
                      <span className="ml-2 text-xs text-yellow-600">
                        ({rel.relationshipType === "adopted" ? "Con nuôi" : "Con ghẻ"})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteRelationship(rel.id)}
                    className="rounded p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Marriage Section */}
      <div className="space-y-4">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Thêm quan hệ Hôn nhân</h2>
          <div className="space-y-3">
            <Select
              label="Người thứ nhất"
              options={memberOptions}
              value={spouse1Id}
              onChange={(e) => setSpouse1Id(e.target.value)}
              placeholder="-- Chọn --"
            />
            <Select
              label="Người thứ hai"
              options={memberOptions}
              value={spouse2Id}
              onChange={(e) => setSpouse2Id(e.target.value)}
              placeholder="-- Chọn --"
            />
            <Input
              label="Ngày cưới"
              value={marriageDate}
              onChange={(e) => setMarriageDate(e.target.value)}
              placeholder="VD: 1965, 15/06/1990"
            />
            <Button onClick={addMarriage} disabled={mLoading} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              {mLoading ? "Đang thêm..." : "Thêm hôn nhân"}
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 font-semibold text-gray-900">
            Danh sách Hôn nhân ({marriages.length})
          </h3>
          {marriages.length === 0 ? (
            <p className="text-sm text-gray-400">Chưa có quan hệ hôn nhân nào</p>
          ) : (
            <div className="space-y-2">
              {marriages.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                >
                  <div className="text-sm">
                    <span className="font-medium">{m.spouse1.fullName}</span>
                    <span className="mx-2 text-[#c9a96e]">&hearts;</span>
                    <span className="font-medium">{m.spouse2.fullName}</span>
                    {m.marriageDate && (
                      <span className="ml-2 text-xs text-gray-400">({m.marriageDate})</span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteMarriage(m.id)}
                    className="rounded p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
