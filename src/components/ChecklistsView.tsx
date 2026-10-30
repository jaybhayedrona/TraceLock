import { useState } from 'react';
import {
  GraduationCap,
  Briefcase,
  Award,
  CheckCircle2,
  Circle,
  FileText,
  Link as LinkIcon,
} from 'lucide-react';
import {
  ChecklistItem,
  DocumentItem,
} from '../types';
import {
  toggleChecklistItem,
  linkChecklistDoc,
} from '../api';

interface ChecklistsViewProps {
  checklists: ChecklistItem[];
  documents: DocumentItem[];
  onRefresh: () => Promise<void>;
  onNavigateToDocuments: () => void;
}

export function ChecklistsView({
  checklists,
  documents,
  onRefresh,
  onNavigateToDocuments,
}: ChecklistsViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('college');
  const [linkingItemId, setLinkingItemId] = useState<string | null>(null);

  const categories = [
    { id: 'college', label: 'Higher Studies & Admission', icon: GraduationCap },
    { id: 'jobs', label: 'Corporate Onboarding & Jobs', icon: Briefcase },
    { id: 'scholarship', label: 'Scholarships & Research Grants', icon: Award },
  ];

  const currentItems = checklists.filter((c) => c.checklistId === activeCategory);
  const completedCount = currentItems.filter((c) => c.isCompleted).length;
  const progressPercent = currentItems.length > 0 ? Math.round((completedCount / currentItems.length) * 100) : 0;

  const handleToggle = async (id: string) => {
    try {
      await toggleChecklistItem(id);
      await onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLinkDocument = async (itemId: string, docId: string) => {
    try {
      await linkChecklistDoc(itemId, docId);
      await onRefresh();
      setLinkingItemId(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
            Personalized Document Checklists
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Track verification readiness for college admissions, jobs, and enterprise onboarding workflows.
          </p>
        </div>

        <button
          onClick={onNavigateToDocuments}
          className="px-4 py-2 text-xs font-semibold text-[#243B6B] bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-lg shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          View Registered Documents &rarr;
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] pb-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-[#243B6B] text-white shadow-xs'
                  : 'bg-white text-[#64748B] hover:text-[#172033] border border-[#E2E8F0]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Progress Card */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-[#172033]">Readiness & Completion Progress</span>
          <span className="font-mono font-bold text-[#243B6B] tabular-nums">
            {completedCount} of {currentItems.length} Verified ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#4776D0] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist Items List */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs divide-y divide-[#E2E8F0] overflow-hidden">
        {currentItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#64748B]">
            No checklist items configured for this category.
          </div>
        ) : (
          currentItems.map((item) => {
            const linkedDoc = documents.find((d) => d.id === item.linkedDocId);

            return (
              <div
                key={item.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggle(item.id)}
                    className="mt-0.5 text-slate-400 hover:text-[#243B6B] transition-colors cursor-pointer"
                  >
                    {item.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-[#15966A]" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div>
                    <span
                      className={`font-semibold block ${
                        item.isCompleted ? 'line-through text-slate-400' : 'text-[#172033]'
                      }`}
                    >
                      {item.title}
                    </span>
                    <span className="text-[#64748B] text-[11px] mt-0.5 block">
                      {item.description}
                    </span>

                    {/* Linked Document Tag */}
                    {linkedDoc && (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#4776D0]/10 text-[#243B6B] text-[10px] font-semibold border border-[#4776D0]/20">
                        <FileText className="w-3 h-3 text-[#4776D0]" />
                        <span>Linked: {linkedDoc.originalFilename}</span>
                        <span className="font-mono text-[#15966A]">[{linkedDoc.verificationStatus}]</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Linking Controls */}
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pl-8 sm:pl-0">
                  {linkingItemId === item.id ? (
                    <div className="flex items-center gap-1.5">
                      <select
                        onChange={(e) => handleLinkDocument(item.id, e.target.value)}
                        className="py-1 px-2 bg-slate-50 border border-[#E2E8F0] rounded text-xs text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#4776D0]"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Select uploaded doc...
                        </option>
                        {documents.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.originalFilename}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setLinkingItemId(null)}
                        className="text-xs text-[#64748B] hover:text-[#172033] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setLinkingItemId(item.id)}
                      className="text-xs font-semibold text-[#243B6B] hover:text-[#4776D0] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>{linkedDoc ? 'Change Doc' : 'Link Document'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
