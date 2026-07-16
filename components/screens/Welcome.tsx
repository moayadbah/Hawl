import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuildingColumns,
  faMoon,
  faHandHoldingDollar,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { HawlHeroMark } from "@/components/brand/HawlLogo";
import { Button } from "@/components/ui/Button";

const FEATURES = [
  {
    title: "تجميع تلقائي",
    body: "تربط حساباتك في عدة بنوك عبر المصرفية المفتوحة، وتجمعها في رصيد واحد.",
    icon: faBuildingColumns,
  },
  {
    title: "تتبع الحول الهجري",
    body: "تحلل تاريخ أرصدتك لتحديد لحظة بلوغ النصاب، وتتبع الحول يوما بيوم.",
    icon: faMoon,
  },
  {
    title: "دفع فوري",
    body: "تحسب زكاتك بدقة عند اكتمال الحول، وتدفعها بضغطة واحدة بأكثر من وسيلة.",
    icon: faHandHoldingDollar,
  },
];

export function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-5">
      <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-8">
      <section className="relative overflow-hidden rounded-[28px] border border-alinma-navy/[0.06] bg-white px-6 py-12 text-center shadow-soft sm:px-12 sm:py-16">
        {/* soft brand glow — subtle, single-hue so it doesn't compete with the content */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-alinma-lavender/[0.07] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-alinma-lavender/[0.05] blur-3xl" />

        <div className="relative">
          <div className="-my-8 flex justify-center animate-scale-in">
            <HawlHeroMark size={480} className="h-auto w-44 sm:w-56 lg:w-64" />
          </div>
          <h1 className="mb-4 text-headline-lg-mobile text-alinma-navy sm:text-display-lg animate-fade-up">
            اكتشف متى وكم تزكي
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-alinma-navy/65 sm:text-lg animate-fade-up">
            حَوْل تربط حساباتك البنكية المتعددة، تتبع بلوغ النصاب واكتمال الحول
            الهجري، وتحسب زكاتك بدقة مع زر دفع واحد.
          </p>
          <div className="flex justify-center animate-fade-up">
            <Button size="lg" onClick={onStart} className="px-10">
              ابدأ الآن
              <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
            </Button>
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:mt-0 lg:grid-cols-1">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-card border border-alinma-navy/[0.06] bg-white/70 p-5 shadow-card"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-alinma-cream text-lg text-alinma-copperDark">
              <FontAwesomeIcon icon={f.icon} />
            </div>
            <h3 className="mb-1.5 text-title-md text-alinma-navy">{f.title}</h3>
            <p className="text-[13.5px] leading-relaxed text-alinma-navy/60">
              {f.body}
            </p>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
