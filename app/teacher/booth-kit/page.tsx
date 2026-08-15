"use client";

import { BoothKitView } from "@/components/BoothKitView";
import { TeacherGate } from "@/components/TeacherGate";

export default function BoothKitPage() {
  return <TeacherGate>{() => <BoothKitView />}</TeacherGate>;
}
