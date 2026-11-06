import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../services/auth.service';

interface GrupoNav {
  titulo: string;
  enlaces: { ruta: string; etiqueta: string }[];
}

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  protected readonly auth = inject(AuthService);
  protected readonly menuAbierto = signal(false);

  protected readonly grupos: GrupoNav[] = [
    {
      titulo: 'Operacion',
      enlaces: [
        { ruta: '/dashboard', etiqueta: 'Dashboard' },
        { ruta: '/citas', etiqueta: 'Citas' },
        { ruta: '/ordenes', etiqueta: 'Ordenes de trabajo' },
        { ruta: '/clientes', etiqueta: 'Clientes' },
        { ruta: '/vehiculos', etiqueta: 'Vehiculos' },
      ],
    },
    {
      titulo: 'Catalogos',
      enlaces: [
        { ruta: '/mecanicos', etiqueta: 'Mecanicos' },
        { ruta: '/paquetes', etiqueta: 'Paquetes' },
        { ruta: '/insumos', etiqueta: 'Inventario' },
        { ruta: '/reportes', etiqueta: 'Reportes' },
      ],
    },
  ];

  protected readonly iniciales = computed(() => {
    const nombre = this.auth.usuario()?.nombreCompleto ?? 'Usuario';
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join('');
  });

  protected readonly hoy = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  protected cerrarSesion(): void {
    this.auth.logout();
  }
}
