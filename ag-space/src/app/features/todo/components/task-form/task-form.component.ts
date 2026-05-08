import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { TodoFacade } from '../../services/todo.facade';
import { Category } from '../../models/category.model';
import { Task, TaskPriority, TaskStatus, PRIORITY_CONFIG, STATUS_CONFIG } from '../../models/task.model';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, TextareaModule, SelectModule, ButtonModule, DatePickerModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormComponent implements OnInit {
  private readonly facade = inject(TodoFacade);

  readonly categories = input.required<Category[]>();
  readonly taskId = input<string | null>(null);

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  readonly isLoading = this.facade.isLoading;

  // Form fields
  title = '';
  description = '';
  selectedCategory: string | null = null;
  priority: TaskPriority = 'medium';
  status: TaskStatus = 'todo';
  startDate: Date | null = null;
  dueDate: Date | null = null;

  // Add category form
  showAddCategory = false;
  newCategoryName = '';
  readonly isAddingCategory = signal(false);

  readonly priorityOptions = Object.entries(PRIORITY_CONFIG).map(([value, config]) => ({
    value: value as TaskPriority,
    label: config.label,
  }));

  readonly statusOptions = Object.entries(STATUS_CONFIG).map(([value, config]) => ({
    value: value as TaskStatus,
    label: config.label,
  }));

  readonly categoryOptions = computed(() => [
    { value: null, label: 'Uncategorized' },
    ...this.categories().map(c => ({ value: c.id, label: c.name })),
  ]);

  readonly isEditing = computed(() => !!this.taskId());

  ngOnInit(): void {
    if (this.taskId()) {
      this.loadTaskData();
    }
  }

  private loadTaskData(): void {
    const task = this.facade.tasks().find(t => t.id === this.taskId());
    if (task) {
      this.title = task.title;
      this.description = task.description || '';
      this.selectedCategory = task.category_id;
      this.priority = task.priority;
      this.status = task.status;
      this.startDate = task.start_date ? new Date(task.start_date) : null;
      this.dueDate = task.due_date ? new Date(task.due_date) : null;
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.isValid()) return;

    const taskData = {
      title: this.title.trim(),
      description: this.description.trim() || null,
      category_id: this.selectedCategory,
      priority: this.priority,
      status: this.status,
      start_date: this.startDate?.toISOString() || null,
      due_date: this.dueDate?.toISOString() || null,
    };

    let success: boolean;

    if (this.taskId()) {
      success = await this.facade.updateTask(this.taskId()!, taskData);
    } else {
      success = await this.facade.createTask(taskData as Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'completed_at'>);
    }

    if (success) {
      this.saved.emit();
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  isValid(): boolean {
    return this.title.trim().length > 0;
  }

  async onAddCategory(): Promise<void> {
    const name = this.newCategoryName.trim();
    if (!name) return;

    this.isAddingCategory.set(true);
    try {
      const category = await this.facade.createCategory(name);
      if (category) {
        this.selectedCategory = category.id;
        this.showAddCategory = false;
        this.newCategoryName = '';
      }
    } finally {
      this.isAddingCategory.set(false);
    }
  }

  cancelAddCategory(): void {
    this.showAddCategory = false;
    this.newCategoryName = '';
  }

  hasDateError(): boolean {
    if (!this.startDate || !this.dueDate) return false;
    return this.dueDate < this.startDate;
  }
}
