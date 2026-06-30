import React from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Link } from "react-router-dom";
import SeoHead from "../components/SeoHead";
import { Construction } from "lucide-react";

const TrackOrder = () => {
  return (
    <div className="min-h-screen bg-[var(--nf-bg-primary)] text-[color:var(--nf-text-primary)]">
      <SeoHead title="Track Order | Nile Flow Africa" description="Track your order delivery status in real time." noindex={true} />
      <Header />
      <main className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-900/30 to-emerald-900/30 border border-[var(--nf-border-subtle)] mb-6">
            <Construction className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold mb-3">{title}</h1>
          <p className="text-[color:var(--nf-text-secondary)] mb-8">{desc}</p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 rounded-lg font-medium bg-amber-500 hover:bg-amber-400 text-white transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackOrder;
