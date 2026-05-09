import { ChangeDetectionStrategy, Component, input, output, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Task, TaskStatus, ReorderItem } from '../../models/task.model';
import { Category } from '../../models/category.model';
import { TodoFacade } from '../../services/todo.facade';
import { TaskCardComponent } from '../task-card/task-card.component';

interface KanbanColumn {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  dragTargetIndex: number | null;
}

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule, TaskCardComponent],
  templateUrl: './kanban-board.component.html',
  styleUrl: './kanban-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanBoardComponent {
  private readonly facade = inject(TodoFacade);

  readonly tasks = input.required<Task[]>();
  readonly categories = input.required<Category[]>();
  readonly isLoading = input<boolean>(false);

  readonly editTask = output<string>();
  readonly completeTask = output<string>();
  readonly reopenTask = output<string>();
  readonly deleteTask = output<string>();

  readonly dragSource = signal<{ column: TaskStatus; index: number } | null>(null);

  readonly columns = computed<KanbanColumn[]>(() => {
    const all = this.tasks();
    return [
      {
        status: 'todo',
        label: 'Todo',
        tasks: all.filter(t => t.status === 'todo').sort((a, b) => a.sort_order - b.sort_order),
        dragTargetIndex: null,
      },
      {
        status: 'in_progress',
        label: 'In Progress',
        tasks: all.filter(t => t.status === 'in_progress').sort((a, b) => a.sort_order - b.sort_order),
        dragTargetIndex: null,
      },
      {
        status: 'done',
        label: 'Done',
        tasks: all.filter(t => t.status === 'done').sort((a, b) => a.sort_order - b.sort_order),
        dragTargetIndex: null,
      },
    ];
  });

  readonly columnCounts = computed<Record<string, number>>(() => {
    const counts: Record<string, number> = { todo: 0, in_progress: 0, done: 0, blocked: 0, cancelled: 0 };
    for (const col of this.columns()) {
      counts[col.status] = col.tasks.length;
    }
    return counts;
  });

  readonly isLoadingFallback = computed(() => this.isLoading() && this.tasks().length === 0);

  readonly dragColIndex = signal<number | null>(null);
  readonly dragItemIndex = signal<number | null>(null);

  getCategoryForTask(task: Task): Category | null {
    if (!task.category_id) return null;
    return this.categories().find((c: Category) => c.id === task.category_id) || null;
  }

  getSubtasksForTask(taskId: string): Task[] {
    return this.facade.getSubtasks(taskId);
  }

  // ==================== DRAG & DROP ====================

  onDragStart(event: DragEvent, colIdx: number, itemIdx: number): void {
    this.dragColIndex.set(colIdx);
    this.dragItemIndex.set(itemIdx);
    event.dataTransfer?.setData('text/plain', JSON.stringify({ colIdx, itemIdx }));
    event.dataTransfer!.effectAllowed = 'move';
    const el = event.target as HTMLElement;
    el.closest('.task-card-wrapper')?.classList.add('dragging');
  }

  onDragEnd(event: DragEvent): void {
    this.dragColIndex.set(null);
    this.dragItemIndex.set(null);
    document.querySelectorAll('.task-card-wrapper.dragging').forEach(el => el.classList.remove('dragging'));
    document.querySelectorAll('.kanban-column.drag-over').forEach(el => el.classList.remove('drag-over'));
  }

  onColumnDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    (event.currentTarget as HTMLElement)?.closest('.kanban-column')?.classList.add('drag-over');
  }

  onColumnDragLeave(event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    const related = event.relatedTarget as HTMLElement;
    if (!target.contains(related)) {
      target.closest('.kanban-column')?.classList.remove('drag-over');
    }
  }

  onColumnDrop(event: DragEvent, targetColIdx: number): void {
    event.preventDefault();
    const targetCol = event.currentTarget as HTMLElement;
    targetCol.closest('.kanban-column')?.classList.remove('drag-over');

    const raw = event.dataTransfer?.getData('text/plain');
    if (!raw) return;
    const source = JSON.parse(raw) as { colIdx: number; itemIdx: number };

    const cols = this.columns();
    const sourceCol = cols[source.colIdx];
    const targetColData = cols[targetColIdx];
    if (!sourceCol || !targetColData) return;

    const task = sourceCol.tasks[source.itemIdx];
    if (!task) return;

    // Same column: reorder within
    const targetTasks = targetColData.tasks;
    const dropIndex = this.getDropIndex(event, targetCol);

    if (source.colIdx === targetColIdx) {
      const reordered = [...targetTasks];
      const from = source.itemIdx;
      const to = Math.min(dropIndex, reordered.length - 1);
      if (from === to) return;
      const [moved] = reordered.splice(from, 1);
      reordered.splice(to, 0, moved);

      const items: ReorderItem[] = reordered.map((t, i) => ({
        id: t.id,
        sort_order: i,
      }));
      this.facade.reorderTasks(items);
    } else {
      // Different column: change status + assign sort_order
      const sourceTasks = sourceCol.tasks;
      const newStatus = targetColData.status;

      let updatedSourceTasks = sourceTasks.filter(t => t.id !== task.id);
      const updatedTargetTasks = [...targetTasks];
      const insertAt = Math.min(dropIndex, updatedTargetTasks.length);
      updatedTargetTasks.splice(insertAt, 0, { ...task, status: newStatus });

      const items: ReorderItem[] = [
        ...updatedSourceTasks.map((t, i) => ({ id: t.id, sort_order: i })),
        ...updatedTargetTasks.map((t, i) => ({
          id: t.id,
          sort_order: i,
          status: t.id === task.id ? newStatus : undefined,
        })),
      ];
      this.facade.reorderTasks(items);
    }

    this.dragColIndex.set(null);
    this.dragItemIndex.set(null);
    document.querySelectorAll('.task-card-wrapper.dragging').forEach(el => el.classList.remove('dragging'));
  }

  private getDropIndex(event: DragEvent, columnEl: HTMLElement): number {
    const cards = columnEl.querySelectorAll('.task-card-wrapper');
    const mouseY = event.clientY;
    let idx = cards.length;
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (mouseY < mid) {
        idx = i;
        break;
      }
    }
    return idx;
  }

  // ==================== SUBTASK HANDLING ====================

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
