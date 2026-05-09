import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { FileUploadModule, FileSelectEvent } from 'primeng/fileupload';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-meal-input',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TextareaModule, FileUploadModule, TooltipModule],
  templateUrl: './meal-input.component.html',
  styleUrl: './meal-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealInputComponent {
  readonly analyze = output<{ text?: string, file?: File }>();
  readonly manualEntry = output<void>();

  description = signal('');
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);

  onFileSelect(event: FileSelectEvent): void {
    const file = event.files[0];
    if (file) {
      this.selectedFile.set(file);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl.set(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
  }

  onAnalyzeClick(): void {
    if (this.description() || this.selectedFile()) {
      this.analyze.emit({
        text: this.description() || undefined,
        file: this.selectedFile() || undefined
      });
    }
  }

  onManualClick(): void {
    this.manualEntry.emit();
  }

  get isValid(): boolean {
    return !!this.description() || !!this.selectedFile();
  }
}
