import { ChangeDetectionStrategy, Component, input, output, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Task } from '../../models/task.model';
import { Category } from '../../models/category.model';
import { TodoFacade } from '../../services/todo.facade';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule, TaskCardComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent {
  private readonly facade = inject(TodoFacade);

  readonly tasks = input.required<Task[]>();
  readonly categories = input.required<Category[]>();
  readonly isLoading = input<boolean>(false);
  readonly emptyMessage = input<string>('No tasks found');
  readonly showCompleteButton = input<boolean>(true);
  readonly showReopenButton = input<boolean>(false);

  readonly editTask = output<string>();
  readonly completeTask = output<string>();
  readonly reopenTask = output<string>();
  readonly deleteTask = output<string>();

  readonly hasTasks = computed(() => this.tasks().length > 0);

  readonly dragTargetIndex = signal<number | null>(null);
  readonly dragSourceIndex = signal<number | null>(null);

  readonly skeletonCount = 3;

  getCategoryForTask(task: Task): Category | null {
    if (!task.category_id) return null;
    return this.categories().find((c: Category) => c.id === task.category_id) || null;
  }

  getSubtasksForTask(taskId: string): Task[] {
    return this.facade.getSubtasks(taskId);
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }

  onDragStart(event: DragEvent, index: number): void {
    this.dragSourceIndex.set(index);
    event.dataTransfer?.setData('text/plain', String(index));
    event.dataTransfer!.effectAllowed = 'move';
    const el = event.target as HTMLElement;
    const card = el.closest('.task-card-wrapper') as HTMLElement;
    if (card) {
      card.classList.add('dragging');
    }
  }

  onDragEnd(event: DragEvent): void {
    this.dragSourceIndex.set(null);
    this.dragTargetIndex.set(null);
    const el = event.target as HTMLElement;
    const card = el.closest('.task-card-wrapper') as HTMLElement;
    if (card) {
      card.classList.remove('dragging');
    }
    document.querySelectorAll('.drop-indicator').forEach(el => el.classList.remove('drop-indicator-active'));
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    if (this.dragTargetIndex() !== index) {
      this.dragTargetIndex.set(index);
    }
  }

  onDragLeave(event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    const related = event.relatedTarget as HTMLElement;
    if (target && !target.contains(related)) {
      this.dragTargetIndex.set(null);
    }
  }

  onDrop(event: DragEvent, targetIndex: number): void {
    event.preventDefault();
    const sourceIndex = this.dragSourceIndex();
    if (sourceIndex === null || sourceIndex === targetIndex) {
      this.dragSourceIndex.set(null);
      this.dragTargetIndex.set(null);
      return;
    }

    const currentTasks = this.tasks();
    if (sourceIndex < 0 || sourceIndex >= currentTasks.length || targetIndex < 0 || targetIndex >= currentTasks.length) {
      this.dragSourceIndex.set(null);
      this.dragTargetIndex.set(null);
      return;
    }

    const task = currentTasks[sourceIndex];

    const reordered = [...currentTasks];
    reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, task);

    const reorderItems = reordered.map((t, i) => ({
      id: t.id,
      sort_order: i,
    }));

    this.facade.reorderTasks(reorderItems);

    this.dragSourceIndex.set(null);
    this.dragTargetIndex.set(null);
    document.querySelectorAll('.drop-indicator').forEach(el => el.classList.remove('drop-indicator-active'));
  }

  onSubtaskToggled(event: { id: string; completed: boolean }): void {
    this.facade.toggleSubtask(event.id, event.completed);
  }

  onSubtaskDeleted(subtaskId: string): void {
    this.facade.deleteSubtask(subtaskId);
  }

  onCreateSubtask(event: { parentId: string; title: string }): void {
    this.facade.createSubtask(event.parentId, event.title);
  }
}
