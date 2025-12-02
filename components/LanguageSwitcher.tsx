'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common');

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger 
        className="w-[140px] px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 hover:border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
        aria-label={t('language')}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-white">
  <SelectItem value="ru" className="hover:bg-gray-100">Русский</SelectItem>
  <SelectItem value="uz" className="hover:bg-gray-100">O'zbek</SelectItem>
  <SelectItem value="en" className="hover:bg-gray-100">English</SelectItem>
</SelectContent>
    </Select>
  );
}
