import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  imports: [],
  templateUrl: './progress-ring.component.html',
  styleUrl: './progress-ring.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressRingComponent {
  readonly radius = input<number>(60);
  readonly stroke = input<number>(10);
  readonly progress = input.required<number>(); // 0 to 100
  readonly color = input<string>('var(--primary-color)');

  readonly normalizedRadius = computed(() => this.radius() - this.stroke() * 2);
  readonly circumference = computed(() => this.normalizedRadius() * 2 * Math.PI);
  readonly strokeDashoffset = computed(() => {
    const p = Math.min(100, Math.max(0, this.progress()));
    return this.circumference() - (p / 100) * this.circumference();
  });
}
