import { Component, inject, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../modules/material.module';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { TranslocoModule } from '@jsverse/transloco';
import { NPC, SupabaseService } from '../../../services/supabase/supabase.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
    selector: 'app-npc-dialog',
    templateUrl: './npc-dialog.component.html',
    styleUrls: ['./npc-dialog.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MaterialModule,
        TranslocoModule,
        ReactiveFormsModule,
        MatProgressSpinnerModule,
        MatDialogContent,
        MatDialogActions
    ],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('300ms ease-in', style({ opacity: 1 }))
            ])
        ]),
        trigger('imageAnimation', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.8)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
            ])
        ])
    ]
})
export class NPCDialogComponent implements OnInit, OnDestroy {
    private _supabaseService: SupabaseService = inject(SupabaseService);
    private _formBuilder: FormBuilder = inject(FormBuilder);
    private _snackBar: MatSnackBar = inject(MatSnackBar);
    private _destroy$ = new Subject<void>();

    public npcForm: FormGroup;
    public isEditMode: boolean = false;
    public isSubmitting: boolean = false;
    public imageLoading: boolean = false;
    public imageError: boolean = false;
    
    // NPC Type options for better categorization
    public npcTypes = [
        { value: 'merchant', label: 'npc-type-merchant' },
        { value: 'quest-giver', label: 'npc-type-quest-giver' },
        { value: 'guard', label: 'npc-type-guard' },
        { value: 'innkeeper', label: 'npc-type-innkeeper' },
        { value: 'noble', label: 'npc-type-noble' },
        { value: 'commoner', label: 'npc-type-commoner' },
        { value: 'scholar', label: 'npc-type-scholar' },
        { value: 'other', label: 'npc-type-other' }
    ];
    
    constructor(
        public dialogRef: MatDialogRef<NPCDialogComponent>,
        @Inject(MAT_DIALOG_DATA)
        public data: { npc?: NPC }
    ) {
        this.npcForm = this._formBuilder.group({
            name: ['', [Validators.required]],
            description: [''],
            img_url: ['', [Validators.required]],
            location: [''],
            npc_type: ['commoner'],
            notes: [''],
            occupation: ['']
        });
    }

    public ngOnInit(): void {
        if (this.data?.npc) {
            this.isEditMode = true;
            this.npcForm.patchValue({
                name: this.data.npc.name,
                description: this.data.npc.description,
                img_url: this.data.npc.img_url
            });
        }
        
        // Watch for changes to the image URL to provide real-time preview
        this.npcForm.get('img_url')?.valueChanges
            .pipe(takeUntil(this._destroy$))
            .subscribe(url => {
                if (url) {
                    this.imageLoading = true;
                    this.imageError = false;
                }
            });
    }
    
    public ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
    }
    
    public onImageLoad(): void {
        this.imageLoading = false;
        this.imageError = false;
    }
    
    public onImageError(): void {
        this.imageLoading = false;
        this.imageError = true;
    }

    public async saveNPC(): Promise<void> {
        if (this.npcForm.invalid) {
            this._displaySnackbar('Por favor, completa todos los campos obligatorios');
            return;
        }

        this.isSubmitting = true;

        try {
            // generamos un numero random para el id si es nuevo
            const npcId = this.isEditMode ? this.data.npc!.id : Math.floor(Math.random() * 1000000);

            const npcData: NPC = {
                id: npcId,
                name: this.npcForm.value.name,
                description: this.npcForm.value.description,
                img_url: this.npcForm.value.img_url
            };

            if (this.isEditMode) {
                await this._supabaseService.updateNPC(npcData);
                this._displaySnackbar('NPC actualizado correctamente');
            } else {
                await this._supabaseService.createNPC(npcData);
                this._displaySnackbar('NPC creado correctamente');
            }

            this.dialogRef.close(npcData);
        } catch (error) {
            console.error('Error saving NPC:', error);
            this._displaySnackbar('Error al guardar el NPC. Por favor, inténtalo de nuevo.');
        } finally {
            this.isSubmitting = false;
        }
    }

    private _displaySnackbar(message: string): void {
        this._snackBar.open(message, 'Close', {
            duration: 4000,
        });
    }

    public closeDialog(): void {
        this.dialogRef.close();
    }
}
