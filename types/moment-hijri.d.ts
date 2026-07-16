declare module "moment-hijri" {
  interface HijriMoment {
    iYear(): number;
    iMonth(): number; // 0-based
    iDate(): number;
    year(): number;
    month(): number; // 0-based
    date(): number;
    add(amount: number, unit: string): HijriMoment;
    diff(other: HijriMoment, unit: string): number;
    format(fmt?: string): string;
  }
  interface MomentHijriStatic {
    (input?: string | Date, format?: string): HijriMoment;
    locale(name: string): string;
  }
  const moment: MomentHijriStatic;
  export default moment;
}
