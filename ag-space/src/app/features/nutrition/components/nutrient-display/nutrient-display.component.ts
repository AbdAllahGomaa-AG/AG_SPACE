import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgClass, DecimalPipe } from '@angular/common';

export interface NutrientValue {
  label: string;
  value: number;
  unit: string;
  target?: number;
  color?: string;
}

@Component({
  selector: 'app-nutrient-display',
  standalone: true,
  imports: [NgClass, DecimalPipe],
  templateUrl: './nutrient-display.component.html',
  styleUrl: './nutrient-display.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NutrientDisplayComponent {
  readonly nutrients = input.required<NutrientValue[]>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly layout = input<'grid' | 'list'>('grid');

  getPercent(nutrient: NutrientValue): number {
    if (!nutrient.target) return 0;
    return Math.min(100, (nutrient.value / nutrient.target) * 100);
  }
}
