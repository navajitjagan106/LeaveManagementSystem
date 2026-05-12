import { LogIn } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { fetchMe } from "../../store/slices/authSlice";

const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, initialized } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!initialized) {
      dispatch(fetchMe());
    }
  }, [dispatch, initialized]);

  useEffect(() => {
    if (initialized && user) {
      navigate(user.role_id === 1 ? "/management" : "/dashboard");
    }
  }, [initialized, user, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    // Scroll reveal with IntersectionObserver
    const revealElements = document.querySelectorAll(".reveal-el");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealElements.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="landing-page-wrapper">
      {/* Scope styles specifically for Landing Page to keep it gorgeous and isolated */}
      <style>{`
        .landing-page-wrapper {
          --navy:   var(--lms-sidebar, #0F172A);
          --blue:   var(--lms-primary, #274C77);
          --blue-d: var(--lms-primary-dark, #1B3655);
          --blue-l: var(--lms-primary-light, #A3CEF1);
          --steel:  var(--lms-grey, #6096BA);
          --surface:var(--lms-surface, #E2E8ED);
          --white:  #FFFFFF;
          --success:var(--lms-success, #22C55E);
          --warn:   var(--lms-warning, #F59E0B);
          --danger: var(--lms-danger, #EF4444);
          --text-m: var(--lms-text-muted, #64748B);

          font-family: 'DM Sans', sans-serif;
          background: var(--white);
          color: var(--navy);
          overflow-x: hidden;
          min-height: 100vh;
        }

        .landing-page-wrapper html {
          scroll-behavior: smooth;
        }

        /* ── NAV ── */
        .landing-page-wrapper nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 6vw;
          height: 68px;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(39,76,119,0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .landing-page-wrapper nav.scrolled {
          box-shadow: 0 4px 30px rgba(15,23,42,0.04), 0 1px 0px rgba(15,23,42,0.02);
          background: rgba(255,255,255,0.92);
          height: 62px;
        }

        .landing-page-wrapper .nav-logo {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Instrument Serif', serif;
          font-size: 24px; color: var(--navy); text-decoration: none;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        .landing-page-wrapper .nav-logo-dot {
          width: 34px; height: 34px; border-radius: 10px;
          background: var(--blue);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 3px 12px rgba(39,76,119,0.2);
          transition: transform 0.3s ease;
        }
        .landing-page-wrapper .nav-logo:hover .nav-logo-dot {
          transform: rotate(-8deg) scale(1.05);
        }
        .landing-page-wrapper .nav-logo-dot svg { width: 18px; height: 18px; fill: white; }

        .landing-page-wrapper .nav-links { display: flex; gap: 36px; list-style: none; }
        .landing-page-wrapper .nav-links a {
          font-size: 14px; font-weight: 500; color: var(--text-m);
          text-decoration: none; transition: color 0.2s;
          position: relative;
          padding: 4px 0;
        }
        .landing-page-wrapper .nav-links a::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; width: 100%; height: 2px;
          background: var(--blue);
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.3s ease;
        }
        .landing-page-wrapper .nav-links a:hover { color: var(--navy); }
        .landing-page-wrapper .nav-links a:hover::after {
          transform: scaleX(1);
          transform-origin: left;
        }

        .landing-page-wrapper .nav-cta {
          background: var(--navy); color: white;
          padding: 10px 24px; border-radius: 12px;
          font-size: 14px; font-weight: 500;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(15,23,42,0.1);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .landing-page-wrapper .nav-cta:hover {
          background: var(--blue);
          transform: translateY(-1.5px);
          box-shadow: 0 6px 20px rgba(39,76,119,0.18);
        }

        /* ── HERO ── */
        .landing-page-wrapper .hero {
          min-height: 100vh;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center;
          padding: 130px 6vw 80px;
          position: relative;
          overflow: hidden;
        }

        /* Mesh background */
        .landing-page-wrapper .hero-bg {
          position: absolute; inset: 0; z-index: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(39,76,119,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 10% 80%, rgba(96,150,186,0.10) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 90% 90%, rgba(163,206,241,0.12) 0%, transparent 60%);
        }

        /* Floating orbs */
        .landing-page-wrapper .orb {
          position: absolute; border-radius: 50%;
          filter: blur(60px); pointer-events: none; z-index: 0;
          animation: drift-orb 8s ease-in-out infinite alternate;
        }
        .landing-page-wrapper .orb-1 { width: 400px; height: 400px; background: rgba(39,76,119,0.10); top: -80px; left: -100px; animation-delay: 0s; }
        .landing-page-wrapper .orb-2 { width: 300px; height: 300px; background: rgba(163,206,241,0.18); top: 20%; right: -80px; animation-delay: -3s; }
        .landing-page-wrapper .orb-3 { width: 250px; height: 250px; background: rgba(96,150,186,0.12); bottom: 5%; left: 30%; animation-delay: -6s; }

        @keyframes drift-orb {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(25px, -35px) scale(1.08); }
        }

        /* Grid pattern overlay */
        .landing-page-wrapper .hero-grid {
          position: absolute; inset: 0; z-index: 0;
          background-image:
            linear-gradient(rgba(39,76,119,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(39,76,119,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
        }

        .landing-page-wrapper .hero-content { position: relative; z-index: 1; max-width: 840px; }

        .landing-page-wrapper .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(39,76,119,0.06);
          border: 1px solid rgba(39,76,119,0.12);
          border-radius: 100px;
          padding: 6px 16px 6px 8px;
          font-size: 13px; font-weight: 500; color: var(--blue);
          margin-bottom: 32px;
          animation: fade-up-anim 0.6s ease both;
        }
        .landing-page-wrapper .hero-badge-dot {
          width: 20px; height: 20px; border-radius: 50%;
          background: var(--blue);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 6px rgba(39,76,119,0.25);
        }
        .landing-page-wrapper .hero-badge-dot svg { width: 10px; height: 10px; fill: white; }

        .landing-page-wrapper h1 {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(48px, 7vw, 88px);
          line-height: 1.05;
          color: var(--navy);
          margin-bottom: 24px;
          animation: fade-up-anim 0.6s 0.1s ease both;
        }
        .landing-page-wrapper h1 em {
          font-style: italic;
          color: var(--blue);
          position: relative;
          display: inline-block;
          padding-right: 4px;
        }

        .landing-page-wrapper .hero-sub {
          font-size: clamp(16px, 2vw, 19px);
          color: var(--text-m);
          line-height: 1.65;
          max-width: 580px;
          margin: 0 auto 44px;
          font-weight: 400;
          animation: fade-up-anim 0.6s 0.2s ease both;
        }

        .landing-page-wrapper .hero-actions {
          display: flex; align-items: center; justify-content: center; gap: 14px;
          flex-wrap: wrap;
          animation: fade-up-anim 0.6s 0.3s ease both;
        }

        .landing-page-wrapper .btn-primary {
          background: var(--navy);
          color: white;
          padding: 14px 32px;
          border-radius: 12px;
          font-size: 15px; font-weight: 500;
          text-decoration: none;
          display: flex; align-items: center; gap: 8px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(15,23,42,0.18);
        }
        .landing-page-wrapper .btn-primary:hover {
          background: var(--blue);
          transform: translateY(-2.5px);
          box-shadow: 0 8px 30px rgba(39,76,119,0.25);
        }
        .landing-page-wrapper .btn-primary svg { width: 16px; height: 16px; }

        .landing-page-wrapper .btn-ghost {
          color: var(--navy);
          padding: 14px 28px;
          border-radius: 12px;
          font-size: 15px; font-weight: 500;
          text-decoration: none;
          border: 1px solid rgba(15,23,42,0.12);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex; align-items: center; gap: 8px;
        }
        .landing-page-wrapper .btn-ghost:hover {
          border-color: var(--blue);
          background: rgba(39,76,119,0.04);
          transform: translateY(-2px);
        }

        /* ── HERO DASHBOARD PREVIEW ── */
        .landing-page-wrapper .hero-preview {
          position: relative; z-index: 1;
          margin-top: 72px;
          max-width: 1000px; width: 100%;
          animation: fade-up-anim 0.8s 0.4s ease both;
        }

        .landing-page-wrapper .preview-frame {
          background: var(--navy);
          border-radius: 20px;
          padding: 3px;
          box-shadow:
            0 40px 80px rgba(15,23,42,0.25),
            0 0 0 1px rgba(255,255,255,0.06);
        }

        .landing-page-wrapper .preview-bar {
          background: #1E293B;
          border-radius: 17px 17px 0 0;
          padding: 12px 16px;
          display: flex; align-items: center; gap: 8px;
        }
        .landing-page-wrapper .preview-dots { display: flex; gap: 6px; }
        .landing-page-wrapper .preview-dots span {
          width: 10px; height: 10px; border-radius: 50%;
        }
        .landing-page-wrapper .preview-dots span:nth-child(1) { background: #EF4444; }
        .landing-page-wrapper .preview-dots span:nth-child(2) { background: #F59E0B; }
        .landing-page-wrapper .preview-dots span:nth-child(3) { background: #22C55E; }
        .landing-page-wrapper .preview-url {
          flex: 1; margin: 0 12px;
          background: rgba(255,255,255,0.06);
          border-radius: 6px;
          padding: 4px 12px;
          font-size: 12px; color: rgba(255,255,255,0.4);
          font-family: monospace;
          text-align: left;
        }

        .landing-page-wrapper .preview-body {
          background: #F1F5F9;
          border-radius: 0 0 17px 17px;
          display: grid;
          grid-template-columns: 200px 1fr;
          min-height: 380px;
          overflow: hidden;
        }

        /* Fake sidebar */
        .landing-page-wrapper .fake-sidebar {
          background: var(--navy);
          padding: 20px 0;
          display: flex; flex-direction: column; gap: 2px;
          text-align: left;
        }
        .landing-page-wrapper .fake-sidebar-logo {
          padding: 0 20px 20px;
          font-family: 'Instrument Serif', serif;
          font-size: 18px; color: white;
          display: flex; align-items: center; gap: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 8px;
          font-weight: 600;
        }
        .landing-page-wrapper .fake-sidebar-logo-icon {
          width: 28px; height: 28px; border-radius: 8px;
          background: var(--blue);
          display: flex; align-items: center; justify-content: center;
        }
        .landing-page-wrapper .sidebar-item {
          margin: 0 10px;
          padding: 9px 14px;
          border-radius: 8px;
          font-size: 12px; color: rgba(255,255,255,0.5);
          display: flex; align-items: center; gap: 10px;
          cursor: default;
        }
        .landing-page-wrapper .sidebar-item.active {
          background: rgba(255,255,255,0.08);
          color: white;
        }
        .landing-page-wrapper .sidebar-icon {
          width: 16px; height: 16px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        /* Fake main content */
        .landing-page-wrapper .fake-main {
          padding: 24px;
          display: flex; flex-direction: column; gap: 16px;
          overflow: hidden;
          text-align: left;
        }

        .landing-page-wrapper .fake-header {
          display: flex; justify-content: space-between; align-items: center;
        }
        .landing-page-wrapper .fake-title { font-size: 16px; font-weight: 600; color: var(--navy); }
        .landing-page-wrapper .fake-subtitle { font-size: 11px; color: var(--text-m); margin-top: 2px; }

        .landing-page-wrapper .fake-btn {
          background: var(--navy);
          color: white;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 11px; font-weight: 500;
        }

        .landing-page-wrapper .fake-stats {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
        }
        .landing-page-wrapper .stat-card {
          background: white;
          border-radius: 12px;
          padding: 14px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 2px 4px rgba(15,23,42,0.01);
        }
        .landing-page-wrapper .stat-label { font-size: 10px; color: var(--text-m); margin-bottom: 4px; font-weight: 500; }
        .landing-page-wrapper .stat-val { font-size: 22px; font-weight: 600; color: var(--navy); }
        .landing-page-wrapper .stat-sub { font-size: 9px; color: var(--text-m); margin-top: 2px; }
        .landing-page-wrapper .stat-bar { height: 4px; border-radius: 2px; background: #E2E8F0; margin-top: 8px; overflow: hidden; }
        .landing-page-wrapper .stat-bar-fill { height: 100%; border-radius: 2px; }

        .landing-page-wrapper .fake-table {
          background: white;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          overflow: hidden;
          flex: 1;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.01), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
        }
        .landing-page-wrapper .fake-table-head {
          display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 80px;
          padding: 10px 16px;
          background: #F8FAFC;
          border-bottom: 1px solid #E2E8F0;
          font-size: 10px; font-weight: 600; color: var(--text-m);
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .landing-page-wrapper .fake-table-row {
          display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 80px;
          padding: 11px 16px;
          border-bottom: 1px solid #F1F5F9;
          align-items: center;
          font-size: 11px; color: var(--navy);
        }
        .landing-page-wrapper .fake-table-row:last-child { border-bottom: none; }
        .landing-page-wrapper .fake-avatar {
          width: 22px; height: 22px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 700; color: white;
          margin-right: 8px;
        }
        .landing-page-wrapper .badge {
          display: inline-flex; align-items: center;
          padding: 2px 8px; border-radius: 100px;
          font-size: 9px; font-weight: 600;
        }
        .landing-page-wrapper .badge-green { background: #DCFCE7; color: #16A34A; }
        .landing-page-wrapper .badge-yellow { background: #FEF9C3; color: #CA8A04; }
        .landing-page-wrapper .badge-red { background: #FEE2E2; color: #DC2626; }

        @keyframes fade-up-anim {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── FEATURES ── */
        .landing-page-wrapper .features {
          padding: 120px 6vw;
          background: var(--white);
          text-align: left;
        }
        .landing-page-wrapper .section-label {
          font-size: 12px; font-weight: 600; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--blue);
          margin-bottom: 16px;
        }
        .landing-page-wrapper .section-title {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(36px, 5vw, 56px);
          line-height: 1.1;
          color: var(--navy);
          max-width: 580px;
        }
        .landing-page-wrapper .section-sub {
          font-size: 17px; color: var(--text-m); line-height: 1.65;
          max-width: 500px; margin-top: 16px;
        }

        .landing-page-wrapper .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 64px;
        }

        .landing-page-wrapper .feature-card {
          background: var(--white);
          border: 1px solid rgba(15,23,42,0.06);
          border-radius: 20px;
          padding: 32px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          text-align: left;
        }
        .landing-page-wrapper .feature-card::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(circle at 80% 20%, rgba(39,76,119,0.04), transparent 60%);
          opacity: 0; transition: opacity 0.3s;
        }
        .landing-page-wrapper .feature-card:hover {
          box-shadow: 0 20px 40px rgba(15,23,42,0.06);
          transform: translateY(-5px);
          border-color: rgba(39,76,119,0.15);
        }
        .landing-page-wrapper .feature-card:hover::before { opacity: 1; }

        .landing-page-wrapper .feature-icon {
          width: 48px; height: 48px; border-radius: 14px;
          background: rgba(39,76,119,0.06);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
          transition: background 0.3s ease;
        }
        .landing-page-wrapper .feature-card:hover .feature-icon {
          background: rgba(39,76,119,0.12);
        }
        .landing-page-wrapper .feature-icon svg { width: 24px; height: 24px; }

        .landing-page-wrapper .feature-title {
          font-size: 18px; font-weight: 600; color: var(--navy);
          margin-bottom: 10px;
        }
        .landing-page-wrapper .feature-desc {
          font-size: 14px; color: var(--text-m); line-height: 1.65;
        }

        /* ── HOW IT WORKS ── */
        .landing-page-wrapper .how {
          padding: 120px 6vw;
          background: #F8FAFC;
          position: relative; overflow: hidden;
        }
        .landing-page-wrapper .how-bg {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 60% 60% at 90% 50%, rgba(163,206,241,0.15), transparent 70%);
          pointer-events: none;
        }

        .landing-page-wrapper .steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          margin-top: 64px;
          position: relative;
        }
        .landing-page-wrapper .steps::before {
          content: '';
          position: absolute;
          top: 28px; left: 80px; right: 80px;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--blue-l), transparent);
        }

        .landing-page-wrapper .step {
          text-align: center;
          padding: 0 24px;
          position: relative;
        }

        .landing-page-wrapper .step-num {
          width: 56px; height: 56px; border-radius: 50%;
          background: var(--navy);
          color: white;
          font-family: 'Instrument Serif', serif;
          font-size: 24px;
          font-weight: bold;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px;
          position: relative; z-index: 1;
          box-shadow: 0 4px 16px rgba(15,23,42,0.15);
          transition: transform 0.3s ease;
        }
        .landing-page-wrapper .step:hover .step-num {
          transform: scale(1.1);
          background: var(--blue);
        }

        .landing-page-wrapper .step-title {
          font-size: 16px; font-weight: 600; color: var(--navy); margin-bottom: 10px;
        }
        .landing-page-wrapper .step-desc { font-size: 13.5px; color: var(--text-m); line-height: 1.6; }

        /* ── ROLES ── */
        .landing-page-wrapper .roles {
          padding: 120px 6vw;
          background: var(--white);
          text-align: left;
        }

        .landing-page-wrapper .roles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 64px;
        }

        .landing-page-wrapper .role-card {
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(15,23,42,0.06);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: var(--white);
          text-align: left;
        }
        .landing-page-wrapper .role-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(15,23,42,0.08);
          border-color: rgba(39,76,119,0.12);
        }

        .landing-page-wrapper .role-header {
          padding: 28px;
          background: var(--navy);
          color: white;
          position: relative; overflow: hidden;
        }
        .landing-page-wrapper .role-header::after {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 120px; height: 120px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
        }
        .landing-page-wrapper .role-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: rgba(255,255,255,0.10);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
        }
        .landing-page-wrapper .role-icon svg { width: 22px; height: 22px; fill: white; }
        .landing-page-wrapper .role-name { font-size: 19px; font-weight: 600; margin-bottom: 4px; }
        .landing-page-wrapper .role-tag { font-size: 12px; opacity: 0.6; }

        .landing-page-wrapper .role-body { padding: 28px; background: white; }
        .landing-page-wrapper .role-perms { list-style: none; display: flex; flex-direction: column; gap: 12px; }
        .landing-page-wrapper .role-perms li {
          font-size: 13.5px; color: var(--text-m);
          display: flex; align-items: center; gap: 10px;
        }
        .landing-page-wrapper .perm-dot {
          width: 18px; height: 18px; border-radius: 50%;
          background: rgba(34,197,94,0.1);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .landing-page-wrapper .perm-dot svg { width: 10px; height: 10px; }

        /* Admin card highlight */
        .landing-page-wrapper .role-card.admin .role-header { background: linear-gradient(135deg, #0F172A 0%, #274C77 100%); }

        /* ── STATS STRIP ── */
        .landing-page-wrapper .stats-strip {
          padding: 80px 6vw;
          background: var(--navy);
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
        }
        .landing-page-wrapper .stat-item {
          text-align: center;
          padding: 0 20px;
          border-right: 1px solid rgba(255,255,255,0.08);
        }
        .landing-page-wrapper .stat-item:last-child { border-right: none; }
        .landing-page-wrapper .stat-item-num {
          font-family: 'Instrument Serif', serif;
          font-size: 54px; color: white;
          line-height: 1;
          font-weight: 600;
        }
        .landing-page-wrapper .stat-item-num span { color: var(--blue-l); }
        .landing-page-wrapper .stat-item-label {
          font-size: 14px; color: rgba(255,255,255,0.5);
          margin-top: 8px;
        }

        /* ── TESTIMONIALS ── */
        .landing-page-wrapper .testimonials {
          padding: 120px 6vw;
          background: #F8FAFC;
        }

        .landing-page-wrapper .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 64px;
        }

        .landing-page-wrapper .testimonial-card {
          background: white;
          border-radius: 20px;
          padding: 32px;
          border: 1px solid rgba(15,23,42,0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
        }
        .landing-page-wrapper .testimonial-card:hover {
          box-shadow: 0 20px 40px rgba(15,23,42,0.06);
          transform: translateY(-4px);
        }

        .landing-page-wrapper .stars { display: flex; gap: 4px; margin-bottom: 20px; }
        .landing-page-wrapper .star { color: var(--warn); font-size: 14px; }

        .landing-page-wrapper .testimonial-text {
          font-size: 15px; color: var(--navy);
          line-height: 1.7; margin-bottom: 24px;
          font-style: italic;
        }

        .landing-page-wrapper .testimonial-author {
          display: flex; align-items: center; gap: 12px;
        }
        .landing-page-wrapper .author-avatar {
          width: 40px; height: 40px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 14px; color: white;
          flex-shrink: 0;
        }
        .landing-page-wrapper .author-name { font-size: 14px; font-weight: 600; color: var(--navy); }
        .landing-page-wrapper .author-role { font-size: 12px; color: var(--text-m); }

        /* ── CTA ── */
        .landing-page-wrapper .cta {
          padding: 120px 6vw;
          background: var(--white);
          text-align: center;
          position: relative; overflow: hidden;
        }
        .landing-page-wrapper .cta-bg {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 60% 80% at 50% 100%, rgba(39,76,119,0.07), transparent 70%);
        }

        .landing-page-wrapper .cta-box {
          position: relative; z-index: 1;
          background: var(--navy);
          border-radius: 28px;
          padding: 72px 48px;
          max-width: 880px;
          margin: 0 auto;
          overflow: hidden;
          box-shadow: 0 30px 60px rgba(15,23,42,0.15);
        }
        .landing-page-wrapper .cta-box::before {
          content: '';
          position: absolute;
          top: -100px; right: -100px;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(163,206,241,0.12), transparent 70%);
        }
        .landing-page-wrapper .cta-box::after {
          content: '';
          position: absolute;
          bottom: -80px; left: -80px;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(96,150,186,0.10), transparent 70%);
        }

        .landing-page-wrapper .cta-title {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(36px, 5vw, 56px);
          color: white;
          margin-bottom: 20px;
          position: relative; z-index: 1;
        }
        .landing-page-wrapper .cta-title em { color: var(--blue-l); font-style: italic; }
        .landing-page-wrapper .cta-sub {
          font-size: 17px; color: rgba(255,255,255,0.6);
          max-width: 480px; margin: 0 auto 44px;
          line-height: 1.65;
          position: relative; z-index: 1;
        }
        .landing-page-wrapper .cta-actions {
          display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
          position: relative; z-index: 1;
        }
        .landing-page-wrapper .cta-btn {
          background: white; color: var(--navy);
          padding: 14px 32px; border-radius: 12px;
          font-size: 15px; font-weight: 600;
          text-decoration: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .landing-page-wrapper .cta-btn:hover {
          background: var(--blue-l);
          transform: translateY(-2.5px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.25);
        }
        .landing-page-wrapper .cta-btn-ghost {
          color: rgba(255,255,255,0.85);
          padding: 14px 28px; border-radius: 12px;
          font-size: 15px; font-weight: 500;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,0.15);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .landing-page-wrapper .cta-btn-ghost:hover {
          border-color: rgba(255,255,255,0.45);
          color: white;
          background: rgba(255,255,255,0.05);
        }

        /* ── FOOTER ── */
        .landing-page-wrapper footer {
          background: var(--navy);
          padding: 56px 6vw 36px;
          text-align: left;
        }
        .landing-page-wrapper .footer-top {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 48px;
          padding-bottom: 48px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .landing-page-wrapper .footer-brand-desc {
          font-size: 14px; color: rgba(255,255,255,0.45);
          line-height: 1.65; margin-top: 14px; max-width: 280px;
        }
        .landing-page-wrapper .footer-col-title {
          font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.6);
          text-transform: uppercase; letter-spacing: 0.1em;
          margin-bottom: 16px;
        }
        .landing-page-wrapper .footer-links { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .landing-page-wrapper .footer-links a {
          font-size: 14px; color: rgba(255,255,255,0.45);
          text-decoration: none; transition: color 0.2s;
        }
        .landing-page-wrapper .footer-links a:hover { color: white; }
        .landing-page-wrapper .footer-bottom {
          padding-top: 28px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .landing-page-wrapper .footer-copy { font-size: 13px; color: rgba(255,255,255,0.3); }

        /* ── SCROLL REVEAL ── */
        .landing-page-wrapper .reveal-el {
          opacity: 0; transform: translateY(32px);
          transition: opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1), transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .landing-page-wrapper .reveal-el.visible { opacity: 1; transform: none; }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .landing-page-wrapper .features-grid, 
          .landing-page-wrapper .roles-grid, 
          .landing-page-wrapper .testimonials-grid { grid-template-columns: 1fr; gap: 24px; }
          .landing-page-wrapper .steps { grid-template-columns: 1fr 1fr; gap: 24px; }
          .landing-page-wrapper .steps::before { display: none; }
          .landing-page-wrapper .stats-strip { grid-template-columns: repeat(2, 1fr); gap: 24px; }
          .landing-page-wrapper .stat-item { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 20px 0; }
          .landing-page-wrapper .stat-item:nth-child(even) { border-bottom: none; }
          .landing-page-wrapper .footer-top { grid-template-columns: 1fr 1fr; }
          .landing-page-wrapper .preview-body { grid-template-columns: 1fr; }
          .landing-page-wrapper .fake-sidebar { display: none; }
          .landing-page-wrapper nav { padding: 0 4vw; }
          .landing-page-wrapper .nav-links { display: none; }
        }
      `}</style>

      {/* NAV */}
      <nav id="navbar" className={scrolled ? "scrolled" : ""}>
        <a href="#navbar" className="nav-logo">
          <div className="nav-logo-dot">
            <svg viewBox="0 0 24 24">
              <path
                d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
                stroke="white"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
          DayOff
        </a>
        <ul className="nav-links">
          <li>
            <a href="#features">Features</a>
          </li>
          <li>
            <a href="#how">How it works</a>
          </li>
          <li>
            <a href="#roles">Roles</a>
          </li>
        </ul>
        <Link to="/login" className="nav-cta">
          Login <LogIn/>
        </Link>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-grid"></div>
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>

        <div className="hero-content">
          <div className="hero-badge">
            <div className="hero-badge-dot">
              <svg viewBox="0 0 10 10">
                <path
                  d="M2 5l2.5 2.5L8 3"
                  stroke="white"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            Leave management, finally done right
          </div>

          <h1>
            Your team deserves
            <br />
            <em>smarter</em> time off
          </h1>

          <p className="hero-sub">
            DayOff gives employees, managers, and HR one beautiful place to apply, approve, and track leave — with full role-based access control built in.
          </p>

          <div className="hero-actions">
            <Link to="/login" className="btn-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Start for free
            </Link>
            <a href="#features" className="btn-ghost">
              See features
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ width: "16px", height: "16px" }}
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          </div>
        </div>

        {/* Dashboard preview */}
        <div className="hero-preview reveal-el">
          <div className="preview-frame">
            <div className="preview-bar">
              <div className="preview-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="preview-url">dayoff.app/dashboard</div>
            </div>
            <div className="preview-body">
              <div className="fake-sidebar">
                <div className="fake-sidebar-logo">
                  <div className="fake-sidebar-logo-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path
                        d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
                        stroke="white"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  DayOff
                </div>
                <div className="sidebar-item active">
                  <div
                    className="sidebar-icon"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  ></div>
                  Dashboard
                </div>
                <div className="sidebar-item">
                  <div
                    className="sidebar-icon"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  ></div>
                  Apply Leave
                </div>
                <div className="sidebar-item">
                  <div
                    className="sidebar-icon"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  ></div>
                  Approvals
                </div>
                <div className="sidebar-item">
                  <div
                    className="sidebar-icon"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  ></div>
                  History
                </div>
                <div className="sidebar-item">
                  <div
                    className="sidebar-icon"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  ></div>
                  Calendar
                </div>
                <div className="sidebar-item">
                  <div
                    className="sidebar-icon"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  ></div>
                  Balance
                </div>
              </div>
              <div className="fake-main">
                <div className="fake-header">
                  <div>
                    <div className="fake-title">Good morning, Rick 👋</div>
                    <div className="fake-subtitle">
                      Here's your leave overview
                    </div>
                  </div>
                  <div className="fake-btn">+ Apply Leave</div>
                </div>
                <div className="fake-stats">
                  <div className="stat-card">
                    <div className="stat-label">Available</div>
                    <div className="stat-val" style={{ color: "var(--blue)" }}>
                      11
                    </div>
                    <div className="stat-sub">Casual Leave</div>
                    <div className="stat-bar">
                      <div
                        className="stat-bar-fill"
                        style={{ width: "78%", background: "var(--blue)" }}
                      ></div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Used This Year</div>
                    <div className="stat-val" style={{ color: "var(--steel)" }}>
                      8
                    </div>
                    <div className="stat-sub">Across all types</div>
                    <div className="stat-bar">
                      <div
                        className="stat-bar-fill"
                        style={{ width: "40%", background: "var(--steel)" }}
                      ></div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Pending</div>
                    <div className="stat-val" style={{ color: "var(--warn)" }}>
                      2
                    </div>
                    <div className="stat-sub">Awaiting approval</div>
                    <div className="stat-bar">
                      <div
                        className="stat-bar-fill"
                        style={{ width: "20%", background: "var(--warn)" }}
                      ></div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Entitled</div>
                    <div
                      className="stat-val"
                      style={{ color: "var(--success)" }}
                    >
                      30
                    </div>
                    <div className="stat-sub">Total this year</div>
                    <div className="stat-bar">
                      <div
                        className="stat-bar-fill"
                        style={{ width: "100%", background: "var(--success)" }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="fake-table">
                  <div className="fake-table-head">
                    <span>Employee</span>
                    <span>Type</span>
                    <span>Dates</span>
                    <span>Days</span>
                    <span>Status</span>
                  </div>
                  <div className="fake-table-row">
                    <span>
                      <span
                        className="fake-avatar"
                        style={{ background: "var(--blue)" }}
                      >
                        G
                      </span>
                      Glenn
                    </span>
                    <span>Casual</span>
                    <span>Jun 15–17</span>
                    <span>3</span>
                    <span>
                      <span className="badge badge-yellow">Pending</span>
                    </span>
                  </div>
                  <div className="fake-table-row">
                    <span>
                      <span
                        className="fake-avatar"
                        style={{ background: "var(--steel)" }}
                      >
                        S
                      </span>
                      Shane
                    </span>
                    <span>Sick</span>
                    <span>May 20</span>
                    <span>1</span>
                    <span>
                      <span className="badge badge-green">Approved</span>
                    </span>
                  </div>
                  <div className="fake-table-row">
                    <span>
                      <span
                        className="fake-avatar"
                        style={{ background: "var(--danger)" }}
                      >
                        R
                      </span>
                      Rosita
                    </span>
                    <span>Earned</span>
                    <span>Apr 25</span>
                    <span>1</span>
                    <span>
                      <span className="badge badge-red">Rejected</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features" id="features">
        <div className="reveal-el">
          <p className="section-label">Everything you need</p>
          <h2 className="section-title">Built for real teams, not spreadsheets</h2>
          <p className="section-sub">
            From a solo manager to a 500-person org — DayOff scales with your team and keeps everyone in sync.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card reveal-el">
            <div className="feature-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--blue)"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div className="feature-title">One-click approvals</div>
            <div className="feature-desc">
              Managers get instant notifications and can approve or reject with a reason right from the approvals dashboard — no email chains.
            </div>
          </div>

          <div className="feature-card reveal-el">
            <div className="feature-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--blue)"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <div className="feature-title">Role-based access</div>
            <div className="feature-desc">
              Admin, Manager, HR, CEO, custom roles — each sees exactly what they need. Permissions are fully configurable per page and action.
            </div>
          </div>

          <div className="feature-card reveal-el">
            <div className="feature-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--blue)"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <div className="feature-title">Team calendar</div>
            <div className="feature-desc">
              See who's away and when across your entire team. Holidays are synced automatically so you never miss a day that matters.
            </div>
          </div>

          <div className="feature-card reveal-el">
            <div className="feature-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--blue)"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="feature-title">Leave policy engine</div>
            <div className="feature-desc">
              Create unlimited leave types and policies. Assign policies per employee — Standard, Senior, Probation — with automatic balance seeding.
            </div>
          </div>

          <div className="feature-card reveal-el">
            <div className="feature-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--blue)"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
            </div>
            <div className="feature-title">Real-time balance tracking</div>
            <div className="feature-desc">
              Employees always know how many days they have left. Balances update instantly on approval, with a visual breakdown per leave type.
            </div>
          </div>

          <div className="feature-card reveal-el">
            <div className="feature-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--blue)"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="feature-title">Smart invitations</div>
            <div className="feature-desc">
              Invite employees individually or via bulk CSV upload. Emails sent automatically with a secure one-time link. No passwords created by HR.
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how" id="how">
        <div className="how-bg"></div>
        <div className="reveal-el" style={{ textAlign: "center" }}>
          <p className="section-label">How it works</p>
          <h2 className="section-title" style={{ margin: "0 auto", textAlign: "center" }}>
            Up and running in minutes
          </h2>
        </div>

        <div className="steps">
          <div className="step reveal-el">
            <div className="step-num">1</div>
            <div className="step-title">Admin sets up</div>
            <div className="step-desc">
              Create leave types, set policies, configure holidays and role permissions all from the admin dashboard.
            </div>
          </div>
          <div className="step reveal-el">
            <div className="step-num">2</div>
            <div className="step-title">Invite your team</div>
            <div className="step-desc">
              Upload a CSV or invite individually. Each person receives a secure email link to set their password and join instantly.
            </div>
          </div>
          <div className="step reveal-el">
            <div className="step-num">3</div>
            <div className="step-title">Employees apply</div>
            <div className="step-desc">
              Pick leave type, choose dates, add a reason. Working days auto-calculated, manager notified by email and in-app.
            </div>
          </div>
          <div className="step reveal-el">
            <div className="step-num">4</div>
            <div className="step-title">Managers approve</div>
            <div className="step-desc">
              One click to approve or reject with a note. Balances update instantly and employees are notified in real time.
            </div>
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section className="roles" id="roles">
        <div className="reveal-el">
          <p className="section-label">Role-based access</p>
          <h2 className="section-title">Every role gets exactly what they need</h2>
          <p className="section-sub">
            No more sharing login credentials or over-permissioning. Fully customisable permissions per page and action.
          </p>
        </div>

        <div className="roles-grid">
          <div className="role-card admin reveal-el">
            <div className="role-header">
              <div className="role-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="role-name">Admin</div>
              <div className="role-tag">Full system access · No restrictions</div>
            </div>
            <div className="role-body">
              <ul className="role-perms">
                <li>
                  <div className="perm-dot">
                    <svg viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2 2 4-4"
                        stroke="#16A34A"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  Manage all employees and invitations
                </li>
                <li>
                  <div className="perm-dot">
                    <svg viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2 2 4-4"
                        stroke="#16A34A"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  Configure leave types, policies, holidays
                </li>
                <li>
                  <div className="perm-dot">
                    <svg viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2 2 4-4"
                        stroke="#16A34A"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  Set permissions per role per page
                </li>
                <li>
                  <div className="perm-dot">
                    <svg viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2 2 4-4"
                        stroke="#16A34A"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  View & export all leave records org-wide
                </li>
                <li>
                  <div className="perm-dot">
                    <svg viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2 2 4-4"
                        stroke="#16A34A"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  Bulk upload via CSV with manager mapping
                </li>
              </ul>
            </div>
          </div>

          <div className="role-card reveal-el">
            <div
              className="role-header"
              style={{
                background: "linear-gradient(135deg, var(--navy), var(--steel))",
              }}
            >
              <div className="role-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="role-name">Manager</div>
              <div className="role-tag">Team-scoped access · Configurable</div>
            </div>
            <div className="role-body">
              <ul className="role-perms">
                <li>
                  <div className="perm-dot">
                    <svg viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2 2 4-4"
                        stroke="#16A34A"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  Approve or reject team leave requests
                </li>
                <li>
                  <div className="perm-dot">
                    <svg viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2 2 4-4"
                        stroke="#16A34A"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  View direct reportees' leave history
                </li>
                <li>
                  <div className="perm-dot">
                    <svg viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2 2 4-4"
                        stroke="#16A34A"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  Access team calendar and directory
                </li>
                <li>
                  <div className="perm-dot">
                    <svg viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2 2 4-4"
                        stroke="#16A34A"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  Apply for own leave with balance tracking
                </li>
                <li>
                  <div className="perm-dot">
                    <svg viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2 2 4-4"
                        stroke="#16A34A"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  Nested reporting — manager to manager
                </li>
              </ul>
            </div>
          </div>

          <div className="role-card reveal-el">
            <div
              className="role-header"
              style={{
                background: "linear-gradient(135deg, var(--blue-d), var(--blue))",
              }}
            >
              <div className="role-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="role-name">Employee</div>
              <div className="role-tag">Self-service · Simple</div>
            </div>
            <div className="role-body">
              <ul className="role-perms">
                <li>
                  <div className="perm-dot">
                    <svg viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2 2 4-4"
                        stroke="#16A34A"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  Apply for leave with date range picker
                </li>
                <li>
                  <div className="perm-dot">
                    <svg viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2 2 4-4"
                        stroke="#16A34A"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  View full leave history with filters
                </li>
                <li>
                  <div className="perm-dot">
                    <svg viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2 2 4-4"
                        stroke="#16A34A"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  Track remaining balance per leave type
                </li>
                <li>
                  <div className="perm-dot">
                    <svg viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2 2 4-4"
                        stroke="#16A34A"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  See who's on leave — team calendar view
                </li>
                <li>
                  <div className="perm-dot">
                    <svg viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2 2 4-4"
                        stroke="#16A34A"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  Cancel pending requests anytime
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-strip">
        <div className="stat-item reveal-el">
          <div className="stat-item-num">
            14<span>+</span>
          </div>
          <div className="stat-item-label">Team members onboarded</div>
        </div>
        <div className="stat-item reveal-el">
          <div className="stat-item-num">7</div>
          <div className="stat-item-label">Leave types supported</div>
        </div>
        <div className="stat-item reveal-el">
          <div className="stat-item-num">
            100<span>%</span>
          </div>
          <div className="stat-item-label">Role-based access control</div>
        </div>
        <div className="stat-item reveal-el">
          <div className="stat-item-num">0</div>
          <div className="stat-item-label">Spreadsheets needed</div>
        </div>
      </div>

      {/* TESTIMONIALS */}
      <section className="testimonials">
        <div className="reveal-el" style={{ textAlign: "center" }}>
          <p className="section-label">Loved by teams</p>
          <h2 className="section-title" style={{ margin: "0 auto", textAlign: "center" }}>
            What people are saying
          </h2>
        </div>

        <div className="testimonials-grid">
          <div className="testimonial-card reveal-el">
            <div className="stars">
              <span className="star">★</span>
              <span className="star">★</span>
              <span className="star">★</span>
              <span className="star">★</span>
              <span className="star">★</span>
            </div>
            <p className="testimonial-text">
              "Managing leave requests used to mean digging through email threads. Now everything's in one place and my team gets notified instantly."
            </p>
            <div className="testimonial-author">
              <div
                className="author-avatar"
                style={{ background: "var(--blue)" }}
              >
                R
              </div>
              <div>
                <div className="author-name">Rick Grimes</div>
                <div className="author-role">HR Manager · Products Dept.</div>
              </div>
            </div>
          </div>

          <div className="testimonial-card reveal-el">
            <div className="stars">
              <span className="star">★</span>
              <span className="star">★</span>
              <span className="star">★</span>
              <span className="star">★</span>
              <span className="star">★</span>
            </div>
            <p className="testimonial-text">
              "The role permissions are exactly what we needed. Our CEO gets a read-only view of all leave records without seeing anything else. Perfect separation."
            </p>
            <div className="testimonial-author">
              <div
                className="author-avatar"
                style={{ background: "var(--steel)" }}
              >
                M
              </div>
              <div>
                <div className="author-name">Michonne</div>
                <div className="author-role">HR Admin · Corporate</div>
              </div>
            </div>
          </div>

          <div className="testimonial-card reveal-el">
            <div className="stars">
              <span className="star">★</span>
              <span className="star">★</span>
              <span className="star">★</span>
              <span className="star">★</span>
              <span className="star">★</span>
            </div>
            <p className="testimonial-text">
              "I love that I can see exactly how many days I have left before I apply. The team calendar shows who else is off so I can plan accordingly."
            </p>
            <div className="testimonial-author">
              <div
                className="author-avatar"
                style={{ background: "var(--blue-d)" }}
              >
                D
              </div>
              <div>
                <div className="author-name">Daryl Dixon</div>
                <div className="author-role">Engineering Manager</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="cta-bg"></div>
        <div className="cta-box reveal-el">
          <h2 className="cta-title">
            Ready to bring <em>order</em>
            <br />
            to your leave chaos?
          </h2>
          <p className="cta-sub">
            Set up in minutes. No credit card. No complicated onboarding. Just a clean, working leave system for your whole team.
          </p>
          <div className="cta-actions">
            <Link to="/login" className="cta-btn">
              Get started free →
            </Link>
            <a href="#features" className="cta-btn-ghost">
              Learn more
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-top">
          <div>
            <a href="#navbar" className="nav-logo" style={{ color: "white", marginBottom: "4px" }}>
              <div className="nav-logo-dot">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              DayOff
            </a>
            <p className="footer-brand-desc">
              A modern leave management system built for teams who care about clarity, fairness, and simplicity.
            </p>
          </div>
          <div>
            <div className="footer-col-title">Product</div>
            <ul className="footer-links">
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#how">How it works</a>
              </li>
              <li>
                <a href="#roles">Roles</a>
              </li>
              <li>
                <Link to="/login">Login</Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Roles</div>
            <ul className="footer-links">
              <li>
                <a href="#roles">Admin</a>
              </li>
              <li>
                <a href="#roles">Manager</a>
              </li>
              <li>
                <a href="#roles">HR Admin</a>
              </li>
              <li>
                <a href="#roles">Employee</a>
              </li>
            </ul>
          </div>
         
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">© 2026 DayOff. Built with care.</span>
          <span className="footer-copy">navajitjagan@gmail.com</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
