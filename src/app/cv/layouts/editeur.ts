import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { CvLayout } from './cv-layout';
import { editorSource } from './editor-source';

/**
 * Style C : le CV rendu comme un fichier TypeScript ouvert dans un éditeur. Ignore le format
 * de la route : jamais de données personnelles.
 */
@Component({
  selector: 'app-layout-editeur',
  templateUrl: './editeur.html',
  styleUrl: './editeur.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditeurLayout extends CvLayout {
  protected readonly lines = computed(() => editorSource(this.cv, this.lang(), this.text()));
  /** Habillage de la barre d'état, pas du contenu. */
  protected readonly statusBar = 'UTF-8 · TypeScript';
}
