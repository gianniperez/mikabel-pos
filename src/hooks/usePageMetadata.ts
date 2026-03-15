"use client";

import { useEffect } from "react";

interface PageMetadata {
  title: string;
  description?: string;
}

/**
 * Hook para manejar metadatos de página en Client Components (Opción B).
 * Actualiza el document.title del navegador de forma imperativa.
 */
export const usePageMetadata = ({ title, description }: PageMetadata) => {
  useEffect(() => {
    const previousTitle = document.title;

    // El formato canónico de Mikabel: "Página | Mikabel"
    const formattedTitle = title.includes("Mikabel")
      ? title
      : `${title} | Mikabel`;

    document.title = formattedTitle;

    // Opcional: Actualizar meta descripción (menos crítico en Client-side UX)
    if (description) {
      const metaDescription = document.querySelector(
        'meta[name="description"]',
      );
      if (metaDescription) {
        metaDescription.setAttribute("content", description);
      }
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title, description]);
};
