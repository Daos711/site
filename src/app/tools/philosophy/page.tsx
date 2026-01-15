"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Search, BookOpen } from "lucide-react";
import { Badge } from "@/components/Badge";
import { getPhilosophySections, type PhilosophyQuestion } from "@/data/philosophy";
import ReactMarkdown from "react-markdown";

export default function PhilosophyPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  const sections = useMemo(() => getPhilosophySections(), []);

  // Фильтрация по поисковому запросу
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;

    const query = searchQuery.toLowerCase();
    return sections
      .map((section) => ({
        ...section,
        questions: section.questions.filter(
          (q) =>
            q.question.toLowerCase().includes(query) ||
            q.answer.toLowerCase().includes(query) ||
            (q.keywords?.some((k) => k.toLowerCase().includes(query)) ?? false)
        ),
      }))
      .filter((section) => section.questions.length > 0);
  }, [sections, searchQuery]);

  // Подсчёт общего количества результатов
  const totalResults = filteredSections.reduce((acc, s) => acc + s.questions.length, 0);

  const toggleSection = (sectionId: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const toggleQuestion = (questionId: number) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(filteredSections.map((s) => s.id)));
    setExpandedQuestions(
      new Set(filteredSections.flatMap((s) => s.questions.map((q) => q.id)))
    );
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
    setExpandedQuestions(new Set());
  };

  // При поиске автоматически раскрываем найденные разделы
  useMemo(() => {
    if (searchQuery.trim()) {
      setExpandedSections(new Set(filteredSections.map((s) => s.id)));
    }
  }, [searchQuery, filteredSections]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Заголовок */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <BookOpen size={24} />
          </div>
          <h1 className="text-3xl font-bold">Философия науки</h1>
        </div>
        <p className="text-muted">
          Ответы на вопросы по философии науки. Используйте поиск или раскрывайте разделы.
        </p>
      </div>

      {/* Поиск */}
      <div className="mb-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            size={20}
          />
          <input
            type="text"
            placeholder="Поиск по вопросам, ответам или ключевым словам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-muted">
            Найдено: {totalResults} {totalResults === 1 ? "вопрос" : totalResults < 5 ? "вопроса" : "вопросов"}
          </p>
        )}
      </div>

      {/* Кнопки управления */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={expandAll}
          className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-card-hover transition-colors"
        >
          Раскрыть всё
        </button>
        <button
          onClick={collapseAll}
          className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-card-hover transition-colors"
        >
          Свернуть всё
        </button>
      </div>

      {/* Разделы */}
      <div className="space-y-4">
        {filteredSections.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <p>Ничего не найдено по запросу &ldquo;{searchQuery}&rdquo;</p>
          </div>
        ) : (
          filteredSections.map((section) => (
            <SectionAccordion
              key={section.id}
              section={section}
              isExpanded={expandedSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
              expandedQuestions={expandedQuestions}
              onToggleQuestion={toggleQuestion}
              searchQuery={searchQuery}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface SectionAccordionProps {
  section: {
    id: number;
    title: string;
    questions: PhilosophyQuestion[];
  };
  isExpanded: boolean;
  onToggle: () => void;
  expandedQuestions: Set<number>;
  onToggleQuestion: (id: number) => void;
  searchQuery: string;
}

function SectionAccordion({
  section,
  isExpanded,
  onToggle,
  expandedQuestions,
  onToggleQuestion,
  searchQuery,
}: SectionAccordionProps) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Заголовок раздела */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-card hover:bg-card-hover text-left"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown size={20} className="text-accent" />
          ) : (
            <ChevronRight size={20} className="text-muted" />
          )}
          <span className="font-semibold">{section.title}</span>
        </div>
        <span className="text-sm text-muted">
          {section.questions.length} {section.questions.length === 1 ? "вопрос" : section.questions.length < 5 ? "вопроса" : "вопросов"}
        </span>
      </button>

      {/* Вопросы раздела */}
      {isExpanded && (
        <div className="border-t border-border">
          {section.questions.map((question) => (
            <QuestionAccordion
              key={question.id}
              question={question}
              isExpanded={expandedQuestions.has(question.id)}
              onToggle={() => onToggleQuestion(question.id)}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface QuestionAccordionProps {
  question: PhilosophyQuestion;
  isExpanded: boolean;
  onToggle: () => void;
  searchQuery: string;
}

function QuestionAccordion({
  question,
  isExpanded,
  onToggle,
  searchQuery,
}: QuestionAccordionProps) {
  // Подсветка найденного текста
  const highlightText = (text: string) => {
    if (!searchQuery.trim()) return text;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-accent/30 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Вопрос */}
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-4 hover:bg-card-hover text-left"
      >
        <span className="text-accent font-mono text-sm mt-0.5">
          {question.number}.
        </span>
        <span className="flex-1">{highlightText(question.question)}</span>
        {isExpanded ? (
          <ChevronDown size={18} className="text-accent shrink-0 mt-0.5" />
        ) : (
          <ChevronRight size={18} className="text-muted shrink-0 mt-0.5" />
        )}
      </button>

      {/* Ответ */}
      {isExpanded && (
        <div className="px-4 pb-4 pl-10">
          <div className="p-4 rounded-lg bg-background border border-border prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{question.answer}</ReactMarkdown>
            {question.keywords && question.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {question.keywords.map((keyword) => (
                  <Badge key={keyword}>{keyword}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
