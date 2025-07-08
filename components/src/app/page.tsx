"use client";

import React, { useState } from "react";
import { Table, TableColumn } from "../components/ui/table/Table";
import { ThemeSelector } from "../components/ui/ThemeSelector";
import { Timeline, TimelineItem } from '../components/ui/timeline/Timeline';

// Example usage:
const newsItems: TimelineItem[] = [
  {
    id: '1',
    date: 'July 8, 2025',
    title: 'Major Market Movement',
    content: 'The S&P 500 reached an all-time high today...'
  },
  {
    id: '2',
    date: 'July 7, 2025',
    title: 'New Tech IPO',
    content: 'A promising startup made its market debut A promising startup made its market debut A promising startup made its market debut A promising startup made its market debut A promising startup made its market debut A promising startup made its market debut A promising startup made its market debut '
  },
  {
    id: '3',
    date: 'July 9, 2025',
    title: 'New Tech IPO',
    content: 'A promising startup made its market debut...'
  },
  {
    id: '4',
    date: 'July 7, 2025',
    title: 'New Tech IPO',
    content: 'A promising startup made its market debut...'
  }
  // ... more items
];

// Sample data type
interface Person {
  id: number;
  name: string;
  dob: string; // ISO date string
  age: number;
  joined: string; // ISO date string
  bio?: string; // NEW: HTML content
}

const columns: TableColumn<Person>[] = [
  { key: "id", header: "ID", type: "integer" },
  { key: "name", header: "Name", type: "string" },
  { key: "dob", header: "Date of Birth", type: "date" },
  { key: "age", header: "Age", type: "integer" },
  { key: "joined", header: "Joined Date", type: "date" },
  { key: "bio", header: "Bio (HTML)", type: "html", renderHTML: true }, // NEW: HTML column
];

const data: Person[] = [
  { id: 1, name: "Alice", dob: "1990-01-15", age: 35, joined: "2020-06-01", bio: "<b>Alice</b> is a <span style='color:green'>developer</span>." },
  { id: 2, name: "Bob", dob: "1985-05-23", age: 40, joined: "2018-09-15", bio: "<i>Bob</i> likes <u>finance</u>." },
  { id: 3, name: "Charlie", dob: "1992-11-30", age: 32, joined: "2021-01-10", bio: "<span style='color:blue'>Charlie</span> is a <b>designer</b>." },
  { id: 4, name: "Diana", dob: "1998-07-12", age: 27, joined: "2023-03-20", bio: "<b>Diana</b> joined <i>recently</i>." },
  { id: 5, name: "Eve", dob: "1980-03-05", age: 45, joined: "2015-12-01", bio: "<span style='color:red'>Eve</span> is a <u>manager</u>." },
  { id: 6, name: "Frank", dob: "1995-09-18", age: 29, joined: "2019-07-22", bio: "<b>Frank</b> works in <i>support</i>." },
  { id: 7, name: "Grace", dob: "1993-02-14", age: 31, joined: "2022-05-30", bio: "<span style='color:purple'>Grace</span> is a <b>lead</b>." },
  { id: 8, name: "Henry", dob: "1988-10-10", age: 36, joined: "2017-11-11", bio: "<b>Henry</b> likes <u>AI</u>." },
  { id: 9, name: "Ivy", dob: "1991-12-25", age: 33, joined: "2020-01-01", bio: "<span style='color:orange'>Ivy</span> is a <b>tester</b>." },
  { id: 10, name: "Jack", dob: "1997-04-08", age: 28, joined: "2024-02-15", bio: "<b>Jack</b> is a <i>newcomer</i>." },
];

export default function Home() {
  // Theme selector options
  const themes = [
    { value: "light", label: "Light", icon: "☀️" },
    { value: "dark", label: "Dark", icon: "🌙" },
    { value: "blue", label: "Blue", icon: "🔵" },
  ];
  const [theme, setThemeState] = useState("light");
  const setTheme = (theme: string) => {
    setThemeState(theme);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  };

  return (
    <main className="p-8 min-h-screen bg-table-bg transition-colors">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-table-header">User Inventory</h1>
        <ThemeSelector theme={theme} setTheme={setTheme} options={themes} />
      </div>
      <Table
        columns={columns}
        data={data}
        enableFilters
        enableSearch
        enablePagination
        enableColumnChooser
        striped
        hoverable
        pageSize={5}
      />
      <Timeline items={newsItems} className="transition-all" enableWidthControl />
    </main>
  );
}
