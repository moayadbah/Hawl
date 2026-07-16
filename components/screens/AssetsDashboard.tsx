import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCoins } from "@fortawesome/free-solid-svg-icons";
import { ZakatResult } from "@/lib/types";
import { BANK_VISUALS } from "@/components/bankVisuals";
import { AlinmaLogo } from "@/components/brand/AlinmaLogo";
import { RajhiLogo } from "@/components/brand/RajhiLogo";
import { SnbLogo } from "@/components/brand/SnbLogo";
import { BankId } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Riyal } from "@/components/ui/Riyal";
import { Card } from "@/components/ui/Card";

function BankBadge({ bank }: { bank: BankId }) {
  if (bank === "alinma") {
    return (
      <div className="flex h-9 items-center rounded-xl bg-alinma-navy px-2.5">
        <AlinmaLogo height={16} variant="white" />
      </div>
    );
  }
  if (bank === "rajhi") {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#005EB8]">
        <RajhiLogo height={22} variant="white" />
      </div>
    );
  }
  if (bank === "snb") {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00754A]">
        <SnbLogo height={22} variant="white" />
      </div>
    );
  }
  return null;
}

export function AssetsDashboard({
  result,
  onNext,
  onBack,
}: {
  result: ZakatResult;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-5">
      <div className="mb-4 text-center">
        <h2 className="mb-1 text-headline-lg-mobile text-alinma-navy sm:text-headline-lg">
          لوحة الأصول
        </h2>
        <p className="text-alinma-navy/60">
          إجمالي أموالك النقدية عبر كل الحسابات المربوطة.
        </p>
      </div>

      {/* total */}
      <Card className="relative overflow-hidden p-7 text-center">
        <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-alinma-lavender/10 blur-2xl" />
        <p className="mb-1 text-sm text-alinma-navy/55">الإجمالي القابل للزكاة</p>
        <div className="text-4xl font-bold text-alinma-navy sm:text-5xl">
          <Riyal value={result.total} decimals={0} />
        </div>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[12.5px] text-alinma-navy/50">
          <FontAwesomeIcon icon={faCoins} className="text-alinma-copperDark" />
          النصاب السوقي الحالي <Riyal value={result.currentNisab} decimals={0} />
        </p>
      </Card>

      {/* per-bank */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {result.banks.map((b) => {
          const v = BANK_VISUALS[b.bank];
          return (
            <Card key={b.bank} className="p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <BankBadge bank={b.bank} />
                <span className="min-w-0 text-[13px] font-medium leading-snug text-alinma-navy/70">
                  {v.nameAr}
                </span>
              </div>
              <div className="text-xl font-bold text-alinma-navy">
                <Riyal value={b.currentBalance} decimals={0} />
              </div>
              <div className="mt-1 text-[12px] text-alinma-navy/45">
                {b.transactionsCount} معاملة محللة
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-7 flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={onBack}>
            رجوع
          </Button>
          <Button size="lg" onClick={onNext} className="sm:px-12">
            عرض سجل الحول
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
          </Button>
        </div>
        <p className="text-[12.5px] text-alinma-navy/45">
          حللنا {result.transactionsAnalyzed} معاملة عبر {result.banks.length} بنوك
        </p>
      </div>
    </div>
  );
}
