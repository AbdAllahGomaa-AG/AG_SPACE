import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmationService } from 'primeng/api';
import { Category } from '../../models/category.model';
import { TaskPriority, TaskStatus, PRIORITY_CONFIG, STATUS_CONFIG } from '../../models/task.model';
import { TodoFacade } from '../../services/todo.facade';

interface FilterOption {
  label: string;
  value: string | null;
}

@Component({
  selector: 'app-task-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, SelectModule, ButtonModule, ConfirmDialogModule, IconFieldModule, InputIconModule],
  providers: [ConfirmationService],
  templateUrl: './task-filters.component.html',
  styleUrl: './task-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFiltersComponent {
  private readonly facade = inject(TodoFacade);
  private readonly confirmationService = inject(ConfirmationService);

  readonly categories = input.required<Category[]>();

  readonly filterChange = output<{ search?: string; category_id?: string | null; priority?: TaskPriority; status?: TaskStatus }>();
  readonly clearFilters = output<void>();
  readonly categoryAdded = output<void>();
  readonly categoryDeleted = output<void>();

  search = '';
  selectedCategory: string | null = null;
  selectedPriority: TaskPriority | null = null;
  selectedStatus: TaskStatus | null = null;

  // Add category form
  showAddCategory = false;
  newCategoryName = '';
  isAddingCategory = false;

  readonly categoryOptions: FilterOption[] = [
    { label: 'All Categories', value: null },
    { label: 'Uncategorized', value: 'uncategorized' },
  ];

  readonly priorityOptions: FilterOption[] = [
    { label: 'All Priorities', value: null },
    ...Object.entries(PRIORITY_CONFIG).map(([key, config]) => ({
      label: config.label,
      value: key,
    })),
  ];

  readonly statusOptions: FilterOption[] = [
    { label: 'All Statuses', value: null },
    ...Object.entries(STATUS_CONFIG).map(([key, config]) => ({
      label: config.label,
      value: key,
    })),
  ];

  get fullCategoryOptions(): FilterOption[] {
    return [
      ...this.categoryOptions,
      ...this.categories().map(c => ({ label: c.name, value: c.id })),
    ];
  }

  onSearchChange(value: string): void {
    this.search = value;
    this.emitFilterChange();
  }

  onCategoryChange(value: string | null): void {
    this.selectedCategory = value;
    this.emitFilterChange();
  }

  onClearCategory(): void {
    this.selectedCategory = null;
    this.emitFilterChange();
  }

  onPriorityChange(value: TaskPriority | null): void {
    this.selectedPriority = value;
    this.emitFilterChange();
  }

  onStatusChange(value: TaskStatus | null): void {
    this.selectedStatus = value;
    this.emitFilterChange();
  }

  onClear(): void {
    this.search = '';
    this.selectedCategory = null;
    this.selectedPriority = null;
    this.selectedStatus = null;
    this.clearFilters.emit();
  }

  hasActiveFilters(): boolean {
    return !!(this.search || this.selectedCategory || this.selectedPriority || this.selectedStatus);
  }

  private emitFilterChange(): void {
    this.filterChange.emit({
      search: this.search || undefined,
      category_id: this.selectedCategory === 'uncategorized' ? null : this.selectedCategory ?? undefined,
      priority: this.selectedPriority ?? undefined,
      status: this.selectedStatus ?? undefined,
    });
  }

  async onAddCategory(): Promise<void> {
    const name = this.newCategoryName.trim();
    if (!name) return;

    this.isAddingCategory = true;
    const category = await this.facade.createCategory(name);
    this.isAddingCategory = false;

    if (category) {
      this.selectedCategory = category.id;
      this.showAddCategory = false;
      this.newCategoryName = '';
      this.categoryAdded.emit();
      this.emitFilterChange();
    }
  }

  cancelAddCategory(): void {
    this.showAddCategory = false;
    this.newCategoryName = '';
  }

  canDeleteCategory(): boolean {
    return !!this.selectedCategory && 
           this.selectedCategory !== 'uncategorized' &&
           this.categories().some(c => c.id === this.selectedCategory);
  }

  onDeleteCategory(): void {
    if (!this.selectedCategory) return;

    const category = this.categories().find(c => c.id === this.selectedCategory);
    if (!category) return;

    this.confirmationService.confirm({
      message: `Are you sure you want to delete the category "${category.name}"? Tasks in this category will be moved to Uncategorized.`,
      header: 'Delete Category',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        const success = await this.facade.deleteCategory(this.selectedCategory!);
        if (success) {
          this.selectedCategory = null;
          this.emitFilterChange();
          this.categoryDeleted.emit();
        }
      }
    });
  }
}
