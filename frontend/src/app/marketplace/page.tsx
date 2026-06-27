"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "../components/Navbar";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { Search, MapPin, Tag, Coins } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { ProjectStatus, getStatusColor, getStatusLabel } from "@/shared/types/project";

export default function MarketplacePage() {
  const { data: projects, isLoading, error } = useProjects();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Tech", "Research", "Edu", "Science", "Social", "Web3"];

  const filteredProjects = projects?.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(search.toLowerCase()) ||
      project.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" ||
      project.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-[#171e19] min-h-screen text-black font-sans pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 md:px-12 mt-12 flex flex-col gap-8">
        {/* Banner */}
        <div className="neo-box p-8 bg-[#b7c6c2] flex flex-col gap-3">
          <h1 className="text-4xl font-black uppercase tracking-tight">Project Marketplace</h1>
          <p className="font-bold text-gray-700 max-w-xl">
            Browse and sponsor verified academic and innovation projects directly via Soroban smart contract escrows.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-grow max-w-lg">
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="neo-input w-full pl-11 pr-4 py-3 rounded-none font-bold placeholder-gray-500"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 border-2 border-black font-black text-sm uppercase transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                  selectedCategory === cat
                    ? "bg-[#ffe17c] translate-x-[1px] translate-y-[1px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="neo-box p-6 bg-white flex flex-col gap-4">
                <Skeleton className="h-6 w-3/4 bg-gray-200" />
                <Skeleton className="h-4 w-full bg-gray-200" />
                <Skeleton className="h-4 w-5/6 bg-gray-200" />
                <div className="border-t-2 border-black pt-4 flex flex-col gap-2">
                  <Skeleton className="h-3 w-1/2 bg-gray-200" />
                  <Skeleton className="h-5 w-full bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Errors */}
        {error && (
          <div className="neo-box p-6 bg-red-100 text-red-700 font-bold text-center border-red-500">
            Error loading marketplace projects: {error.message || "Unknown error occurred"}
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && !error && (
          <>
            {filteredProjects && filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProjects.map((project) => {
                  const goalXlm = Number(project.fundingGoal) / 10000000;
                  const currentXlm = Number(project.currentFunding) / 10000000;
                  const progressPercent = Math.min(100, Math.round((currentXlm / goalXlm) * 100)) || 0;

                  return (
                    <div key={project.id} className="neo-box p-6 bg-white flex flex-col justify-between hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                      <div className="flex flex-col gap-3">
                        {/* Header details */}
                        <div className="flex items-center justify-between">
                          <span className="neo-badge bg-[#b7c6c2] text-xs font-black">{project.category || "General"}</span>
                          <span className={`neo-badge text-xs font-black ${getStatusColor(project.status)}`}>
                            {getStatusLabel(project.status)}
                          </span>
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-black uppercase truncate mt-2">{project.title}</h2>
                        
                        {/* Description */}
                        <p className="text-sm font-bold text-gray-600 line-clamp-3">{project.description}</p>
                      </div>

                      {/* Progress Details */}
                      <div className="border-t-2 border-black pt-4 mt-6 flex flex-col gap-3">
                        <div className="flex justify-between text-xs font-black text-gray-600 uppercase">
                          <span>Progress</span>
                          <span>{progressPercent}% Funded</span>
                        </div>
                        <div className="w-full bg-white border-2 border-black h-4 overflow-hidden">
                          <div
                            className="bg-[#ffe17c] border-r border-black h-full"
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center text-sm font-black mt-1">
                          <div className="flex items-center gap-1">
                            <Coins className="h-4 w-4" />
                            <span>{currentXlm.toLocaleString()} / {goalXlm.toLocaleString()} XLM</span>
                          </div>
                        </div>

                        {/* CTA button */}
                        <Link href={`/projects/${project.id}`} className="neo-btn-black text-center mt-3 py-2 text-sm uppercase">
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="neo-box p-12 bg-white text-center flex flex-col items-center justify-center gap-4">
                <h3 className="text-xl font-black uppercase">No projects found</h3>
                <p className="text-gray-600 font-bold max-w-sm">
                  We couldn't find any projects matching your search criteria. Try a different keyword or category.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
