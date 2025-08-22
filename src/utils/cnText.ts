export type TextVariant = 'title' | 'subtitle' | 'tableCell' | 'tableHeader';

export function cnText(variant: TextVariant = 'title') {
  switch (variant) {
    case 'subtitle':
      return 'text-gray-700 dark:text-gray-300';
    case 'tableCell':
      return 'text-gray-900 dark:text-gray-200';
    case 'tableHeader':
      return 'text-gray-600 dark:text-gray-300';
    default:
      return 'text-gray-900 dark:text-gray-100';
  }
}
