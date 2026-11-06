import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ChecklistItem, EstadoInforme, InformeDetalle } from '../../models/api.models';
import { TallerService } from '../../services/taller.service';

@Component({
  selector: 'app-orden-detalle',
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './orden-detalle.component.html',
  styleUrl: './orden-detalle.component.scss',
})
export class OrdenDetalleComponent implements OnInit {
  private readonly taller = inject(TallerService);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly id = Number(this.ruta.snapshot.paramMap.get('id'));
  protected readonly informe = signal<InformeDetalle | null>(null);
  protected readonly cargando = signal(true);
  protected readonly procesando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  protected readonly completados = computed(
    () =>
      this.informe()?.checklist.filter((item) => item.accionRealizada === 'COMPLETADO').length ?? 0,
  );

  protected readonly totalItems = computed(() => this.informe()?.checklist.length ?? 0);

  protected readonly progreso = computed(() => {
    const total = this.totalItems();
    return total === 0 ? 0 : Math.round((this.completados() / total) * 100);
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.taller.obtenerInforme(this.id).subscribe({
      next: (informe) => {
        this.informe.set(informe);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la orden de trabajo.');
        this.cargando.set(false);
      },
    });
  }

  protected siguienteEstado(): EstadoInforme | null {
    switch (this.informe()?.estado) {
      case 'RECEPCIONADO':
        return 'EN_PROCESO';
      case 'EN_PROCESO':
        return 'LISTO_PARA_ENTREGA';
      case 'LISTO_PARA_ENTREGA':
        return 'ENTREGADO';
      default:
        return null;
    }
  }

  protected avanzar(): void {
    const siguiente = this.siguienteEstado();
    if (!siguiente) {
      return;
    }
    if (
      siguiente === 'ENTREGADO' &&
      !confirm('Registrar la entrega del vehiculo? La orden quedara cerrada.')
    ) {
      return;
    }

    this.procesando.set(true);
    this.taller.cambiarEstadoInforme(this.id, siguiente).subscribe({
      next: () => {
        this.procesando.set(false);
        this.aviso.set(`Estado actualizado a ${siguiente.replaceAll('_', ' ')}.`);
        setTimeout(() => this.aviso.set(null), 3500);
        this.cargar();
      },
      error: (respuesta: HttpErrorResponse) => {
        this.procesando.set(false);
        this.error.set(respuesta.error?.mensaje ?? 'No se pudo cambiar el estado.');
      },
    });
  }

  protected completar(item: ChecklistItem): void {
    this.procesando.set(true);
    this.taller
      .actualizarChecklist(this.id, item.id, {
        estadoComponente: item.estadoComponente || 'OPTIMO',
        accionRealizada: 'COMPLETADO',
        valorMedido: item.valorMedido || 'OK',
        observacionTecnica: item.observacionTecnica || 'Completado desde el panel',
      })
      .subscribe({
        next: () => {
          this.procesando.set(false);
          this.cargar();
        },
        error: (respuesta: HttpErrorResponse) => {
          this.procesando.set(false);
          this.error.set(respuesta.error?.mensaje ?? 'No se pudo actualizar el checklist.');
        },
      });
  }

  protected claseEstado(estado: string): string {
    return `badge badge--${estado.toLowerCase()}`;
  }
}
