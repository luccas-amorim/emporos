import { Colors, type Paleta } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTema(): { cores: Paleta; escuro: boolean } {
  const scheme = useColorScheme();
  const escuro = scheme === 'dark';
  return { cores: escuro ? Colors.dark : Colors.light, escuro };
}
