"use client";

import { PageHeader } from "@/components/PageHeader";
import { Download, BookOpen, CheckCircle, Smartphone } from "lucide-react";

const sections = [
  { name: "Общие проблемы философии науки", questions: 30 },
  { name: "Философские проблемы естествознания", questions: 30 },
  { name: "Философские проблемы техники и технических наук", questions: 30 },
  { name: "Философские проблемы социально-гуманитарных наук", questions: 30 },
];

export default function PhiloQuizPage() {
  return (
    <div>
      <PageHeader
        title="PhiloQuiz"
        description="Подготовка к кандидатскому экзамену по философии науки"
      />

      {/* Описание */}
      <section className="mb-12">
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">О приложении</h2>
          <div className="text-muted space-y-2">
            <p>
              <strong className="text-foreground">PhiloQuiz</strong> — приложение для Android,
              которое поможет подготовиться к кандидатскому экзамену по истории и философии науки.
            </p>
            <p className="mt-4">
              Содержит <strong className="text-foreground">120 вопросов</strong> по 4 разделам
              программы кандидатского минимума.
            </p>
          </div>
        </div>
      </section>

      {/* Разделы */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Разделы
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map((section, idx) => (
            <div
              key={idx}
              className="bg-card border border-border rounded-lg p-4 flex items-start gap-3"
            >
              <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">{section.name}</p>
                <p className="text-sm text-muted">{section.questions} вопросов</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Скачать */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Download className="w-6 h-6" />
          Скачать
        </h2>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Smartphone className="w-8 h-8 text-accent" />
              <div>
                <p className="font-semibold">PhiloQuiz для Android</p>
                <p className="text-sm text-muted">APK файл</p>
              </div>
            </div>
            <a
              href="https://github.com/Daos711/site/releases/download/philoquiz-v1.0/philoquiz.apk"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Скачать APK
            </a>
          </div>
          <p className="text-sm text-muted mt-4">
            Для установки разрешите установку из неизвестных источников в настройках Android.
          </p>
        </div>
      </section>

      {/* Скриншоты (placeholder) */}
      {/*
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Скриншоты</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <img src="/images/philoquiz-1.png" alt="Скриншот 1" className="rounded-lg border border-border" />
          <img src="/images/philoquiz-2.png" alt="Скриншот 2" className="rounded-lg border border-border" />
          <img src="/images/philoquiz-3.png" alt="Скриншот 3" className="rounded-lg border border-border" />
        </div>
      </section>
      */}
    </div>
  );
}
