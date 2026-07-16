import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function Sources({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-5">
      <div className="mb-6">
        <Button variant="secondary" onClick={onBack} className="gap-2">
          <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
          رجوع
        </Button>
      </div>

      <h1 className="mb-2 text-headline-lg-mobile text-alinma-navy sm:text-headline-lg">طريقة حساب الزكاة</h1>
      <p className="mb-8 text-alinma-navy/60">
        يوفّر حَوْل طريقتين لإخراج الزكاة، وحساب الزكاة في كلتيهما مبني على فتاوى موثقة لأهل العلم.
      </p>

      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-2 text-title-md text-alinma-navy">الطريقة السنوية</h2>
          <p className="mb-3 text-[13.5px] leading-relaxed text-alinma-navy/70">
            تُخرج زكاة كامل المبلغ المتوفر في حساباتك دفعة واحدة، مرة كل سنة هجرية عند اكتمال
            الحول.
          </p>
          <p className="rounded-xl bg-alinma-cream/50 p-3 text-[13px] leading-relaxed text-alinma-navy/80">
            الفائدة: الأبسط، خطوة واحدة في السنة، مناسبة لمن يفضّل عدم متابعة كل مبلغ على حدة.
          </p>
        </Card>
        <Card className="p-5">
          <h2 className="mb-2 text-title-md text-alinma-navy">الطريقة الدقيقة</h2>
          <p className="mb-3 text-[13.5px] leading-relaxed text-alinma-navy/70">
            كل مبلغ يُضاف لحساباتك يُحسب له حول هجري مستقل من تاريخ إضافته، وتُخرج زكاته فور تمام
            حوله هو فقط، لا حسب الشهر، فقد تمر أشهر دون أي استحقاق.
          </p>
          <p className="rounded-xl bg-alinma-cream/50 p-3 text-[13px] leading-relaxed text-alinma-navy/80">
            الفائدة: تدفع فقط على المبلغ الذي أكمل حوله فعليًا بدقة، دون تعجيل زكاة عن مبلغ لم
            يكتمل حوله بعد؛ وأي مبلغ يُسحب قبل تمام حوله فلا زكاة عليه أبدًا.
          </p>
        </Card>
      </div>
    </div>
  );
}
