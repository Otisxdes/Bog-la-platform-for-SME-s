'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { routing } from '@/i18n/routing';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common');

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <select 
      value={locale} 
      onChange={(e) => handleLocaleChange(e.target.value)}
      className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
      aria-label={t('language')}
    >
      <option value="ru">Русский</option>
      <option value="uz">O'zbek</option>
      <option value="en">English</option>
    </select>
  );
}
