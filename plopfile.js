module.exports = function (plop) {
  plop.setGenerator("component", {
    description:
      "Generar un React Component transversal / compartido (`src/components`)",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Component name (PascalCase):",
      },
    ],
    actions: [
      {
        type: "add",
        path: "src/components/{{pascalCase name}}/{{pascalCase name}}.tsx",
        templateFile: ".templates/component/Component.tsx.hbs",
      },
      {
        type: "add",
        path: "src/components/{{pascalCase name}}/{{pascalCase name}}.types.ts",
        templateFile: ".templates/component/Component.types.ts.hbs",
      },
      {
        type: "add",
        path: "src/components/{{pascalCase name}}/index.ts",
        templateFile: ".templates/component/index.ts.hbs",
      },
      {
        type: "add",
        path: "src/components/{{pascalCase name}}/{{pascalCase name}}.test.tsx",
        templateFile: ".templates/component/Component.test.tsx.hbs",
      },
    ],
  });

  plop.setGenerator("feature-component", {
    description:
      "Generar un React Component específico para una Feature (`src/features/[feature]/components/`)",
    prompts: [
      {
        type: "input",
        name: "feature",
        message: "Feature name (kebab-case):",
      },
      {
        type: "input",
        name: "name",
        message: "Component name (PascalCase):",
      },
    ],
    actions: [
      {
        type: "add",
        path: "src/features/{{kebabCase feature}}/components/{{pascalCase name}}/{{pascalCase name}}.tsx",
        templateFile: ".templates/component/Component.tsx.hbs",
      },
      {
        type: "add",
        path: "src/features/{{kebabCase feature}}/components/{{pascalCase name}}/{{pascalCase name}}.types.ts",
        templateFile: ".templates/component/Component.types.ts.hbs",
      },
      {
        type: "add",
        path: "src/features/{{kebabCase feature}}/components/{{pascalCase name}}/index.ts",
        templateFile: ".templates/component/index.ts.hbs",
      },
      {
        type: "add",
        path: "src/features/{{kebabCase feature}}/components/{{pascalCase name}}/{{pascalCase name}}.test.tsx",
        templateFile: ".templates/component/Component.test.tsx.hbs",
      },
      {
        type: "append",
        path: "src/features/{{kebabCase feature}}/components/index.ts",
        template: 'export * from "./{{pascalCase name}}";',
      },
    ],
  });

  plop.setGenerator("page", {
    description:
      "Generar una nueva ruta/página en Next.js App Router (`src/app/`)",
    prompts: [
      {
        type: "input",
        name: "routeName",
        message: "Route path and name (e.g. 'dashboard/settings'):",
      },
    ],
    actions: [
      {
        type: "add",
        path: "src/app/{{routeName}}/page.tsx",
        templateFile: ".templates/page/page.tsx.hbs",
      },
    ],
  });

  plop.setGenerator("feature", {
    description:
      "Generar la base de una nueva Feature (Feature-Sliced Design) (`src/features`)",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Feature name (kebab-case):",
      },
    ],
    actions: [
      {
        type: "add",
        path: "src/features/{{kebabCase name}}/api/index.ts",
        template: "// API requests para la feature {{kebabCase name}}\n",
      },
      {
        type: "add",
        path: "src/features/{{kebabCase name}}/components/index.ts",
        template: "// Exporta componentes de la feature {{kebabCase name}}\n",
      },
      {
        type: "add",
        path: "src/features/{{kebabCase name}}/hooks/index.ts",
        template: "// Custom hooks para la feature {{kebabCase name}}\n",
      },
      {
        type: "add",
        path: "src/features/{{kebabCase name}}/types/index.ts",
        template:
          "// Tipos e interfaces globales para la feature {{kebabCase name}}\n",
      },
      {
        type: "add",
        path: "src/features/{{kebabCase name}}/stores/index.ts",
        template:
          "// Zustand stores / Manejo de estado para la feature {{kebabCase name}}\n",
      },
      {
        type: "add",
        path: "src/features/{{kebabCase name}}/index.ts",
        templateFile: ".templates/feature/index.ts.hbs",
      },
    ],
  });
};
