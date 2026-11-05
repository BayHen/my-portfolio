"use client";

import { useState } from "react";
import { MediaAssignments } from "@/components/admin/media-assignments";
import { MediaLibrary } from "@/components/admin/media-library";

export function MediaDashboard() {
  const [revision, setRevision] = useState(0);
  return (
    <div className="space-y-12">
      <MediaLibrary revision={revision} />
      <MediaAssignments onChanged={() => setRevision((value) => value + 1)} />
    </div>
  );
}
