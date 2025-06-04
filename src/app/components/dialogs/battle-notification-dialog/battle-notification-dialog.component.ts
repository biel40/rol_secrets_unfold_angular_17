import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../modules/material.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslocoModule } from '@jsverse/transloco';
import { Enemy } from '../../../services/supabase/supabase.service';
import { trigger, transition, style, animate, sequence, query, stagger } from '@angular/animations';

interface BattleNotificationData {
  enemies: Enemy[];
  battleStartedBy?: string;
}

@Component({
  selector: 'app-battle-notification-dialog',
  templateUrl: './battle-notification-dialog.component.html',
  styleUrls: ['./battle-notification-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    TranslocoModule
  ],
  animations: [
    trigger('dialogEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.7) translateY(-50px)' }),
        animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)',
          style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ])
    ]),
    trigger('swordAnimation', [
      transition(':enter', [
        style({ transform: 'rotate(-45deg) scale(0)', opacity: 0 }),
        sequence([
          animate('300ms ease-out', style({ transform: 'rotate(0deg) scale(1.2)', opacity: 1 })),
          animate('200ms ease-in', style({ transform: 'rotate(0deg) scale(1)' }))
        ])
      ])
    ]),
    trigger('enemyStagger', [
      transition(':enter', [
        query('.enemy-card', [
          style({ opacity: 0, transform: 'translateX(-50px)' }),
          stagger('100ms', [
            animate('300ms ease-out',
              style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('battleCry', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('600ms 200ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class BattleNotificationDialogComponent implements OnInit {

  public enemies: Enemy[] = [];
  public battleStartedBy: string = '';
  public isClosing: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<BattleNotificationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BattleNotificationData
  ) {
    this.dialogRef.disableClose = true;
  }

  public ngOnInit(): void {
    this.enemies = this.data.enemies || [];
    this.battleStartedBy = this.data.battleStartedBy || 'El Maestro del Juego';

    // Play battle sound effect (if available)
    this.playBattleSound();
  }

  public closeDialog(): void {
    this.isClosing = true;
    this.dialogRef.close();
  }

  private playBattleSound(): void {
    // Try to play a battle sound effect if available
    try {
      const audio = new Audio();
      audio.volume = 0.3;
      // You could add a battle sound file to assets and uncomment this:
      // audio.src = 'assets/sounds/battle-horn.mp3';
      // audio.play().catch(() => {
      //   // Sound failed to play, continue silently
      // });
    } catch (error) {
      // Audio not supported or failed, continue silently
    }
  }

  public getEnemyDisplayName(enemy: Enemy): string {
    return enemy.name || 'Enemigo Desconocido';
  }

  public getEnemyLevel(enemy: Enemy): number {
    return enemy.level || 1;
  }

  public getEnemyImageUrl(enemy: Enemy): string {
    return enemy.image_url || 'assets/images/default-enemy.png';
  }
}
