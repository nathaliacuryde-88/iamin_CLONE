import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useHaptics } from "@/hooks/useHaptics";
import Logo from "@/components/Logo";
import { Users, Mic } from "lucide-react";

type AccountKind = "person" | "organizer";

const Welcome = () => {
  const navigate = useNavigate();
  const haptic = useHaptics();
  const { t } = useTranslation();
  const [kind, setKind] = useState<AccountKind | null>(null);
  const [step, setStep] = useState(0);

  const PERSON_SCREENS = [
    { emoji: "🪄", title: t("welcome.person_1_title"), body: t("welcome.person_1_body") },
    { emoji: "🤝", title: t("welcome.person_2_title"), body: t("welcome.person_2_body") },
    { emoji: "📸", title: t("welcome.person_3_title"), body: t("welcome.person_3_body") },
  ];
  const ORGANIZER_SCREENS = [
    { emoji: "🌱", title: t("welcome.org_1_title"), body: t("welcome.org_1_body") },
    { emoji: "🏅", title: t("welcome.org_2_title"), body: t("welcome.org_2_body") },
  ];

  const screens = kind === "organizer" ? ORGANIZER_SCREENS : PERSON_SCREENS;
  const isLast = step === screens.length - 1;

  const pick = (k: AccountKind) => {
    haptic("success");
    try { sessionStorage.setItem("iamin.account_kind", k); } catch { /* ignore */ }
    setKind(k);
    setStep(0);
  };

  const goAuth = () => {
    try { sessionStorage.setItem("iamin.welcome_seen", "1"); } catch { /* ignore */ }
    navigate("/auth");
  };

  const next = () => {
    haptic("selection");
    if (!isLast) setStep(step + 1);
    else goAuth();
  };

  const prev = () => {
    if (step === 0) {
      setKind(null);
      return;
    }
    haptic("selection");
    setStep(step - 1);
  };

  if (!kind) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-between p-6 pt-10 pb-10">
        <div className="text-center">
          <Logo size="text-2xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="flex-1 flex flex-col items-center justify-center text-center max-w-sm w-full"
        >
          <div className="text-7xl mb-6 drop-shadow-[0_10px_30px_hsl(var(--primary)/0.4)]">👋</div>
          <h1 className="text-2xl font-bold tracking-tight leading-tight">{t("welcome.picker_title")}</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {t("welcome.picker_subtitle")}
          </p>

          <div className="mt-8 w-full space-y-3">
            <button
              type="button"
              onClick={() => pick("person")}
              className="w-full text-left rounded-2xl card-surface p-5 transition-all hover:border-primary/40 active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{t("welcome.person_label")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("welcome.person_desc")}</p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => pick("organizer")}
              className="w-full text-left rounded-2xl card-surface p-5 transition-all hover:border-accent/40 active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                  <Mic className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{t("welcome.organizer_label")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("welcome.organizer_desc")}</p>
                </div>
              </div>
            </button>
          </div>
        </motion.div>

        <button
          type="button"
          onClick={() => { haptic("light"); goAuth(); }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {t("welcome.have_account")}
        </button>
      </div>
    );
  }

  const current = screens[step];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between p-6 pt-10 pb-10">
      <div className="text-center">
        <Logo size="text-2xl" />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${kind}-${step}`}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60 || info.velocity.x < -300) next();
            else if (info.offset.x > 60 || info.velocity.x > 300) prev();
          }}
          className="flex-1 flex flex-col items-center justify-center text-center max-w-sm touch-pan-y cursor-grab active:cursor-grabbing"
        >
          <motion.div
            initial={{ scale: 0.7, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 14 }}
            className="text-8xl mb-8 drop-shadow-[0_10px_30px_hsl(var(--primary)/0.4)]"
          >
            {current.emoji}
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight leading-tight">{current.title}</h1>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{current.body}</p>
        </motion.div>
      </AnimatePresence>

      <div className="w-full max-w-sm space-y-5">
        <div className="flex items-center justify-center gap-2">
          {screens.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-primary" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>

        <Button onClick={next} className="w-full h-12 glow-sm text-base">
          {isLast ? t("welcome.get_started") : t("common.next")}
        </Button>

        <button
          type="button"
          onClick={() => { haptic("light"); goAuth(); }}
          className="w-full text-xs text-muted-foreground hover:text-foreground"
        >
          {isLast ? t("welcome.have_account") : t("welcome.skip")}
        </button>
      </div>
    </div>
  );
};

export default Welcome;
