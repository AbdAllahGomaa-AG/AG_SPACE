import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-confidence-badge',
  standalone: true,
  imports: [NgClass],
  templateUrl: './confidence-badge.component.html',
  styleUrl: './confidence-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfidenceBadgeComponent {
  readonly confidence = input.required<number>(); // 0 to 1

  readonly level = computed(() => {
    const c = this.confidence();
    if (c >= 0.7) return 'high';
    if (c >= 0.4) return 'medium';
    return 'low';
  });

  readonly label = computed(() => {
    const l = this.level();
    if (l === 'high') return 'High Confidence';
    if (l === 'medium') return 'Medium Confidence';
    return 'Low Confidence';
  });

  readonly icon = computed(() => {
    const l = this.level();
    if (l === 'high') return 'pi pi-verified';
    if (l === 'medium') return 'pi pi-info-circle';
    return 'pi pi-exclamation-triangle';
  });
}
