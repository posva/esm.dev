<template>
  <div class="w-full">
    <div class="chat chat-end">
      <div class="chat-bubble">
        <slot></slot>
      </div>
    </div>

    <div class="chat chat-start">
      <div class="shadow-inner shadow-neutral-200 chat-bubble bg-slate-400">
        <slot name="answer"></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(p) {
  margin: 0;
}

:deep(img) {
  margin: 0;
}

.chat {
  @apply grid grid-cols-2 gap-x-3 py-1;
  &-image {
    @apply row-span-2 self-end;
  }
  &-header {
    @apply row-start-1 text-sm;
  }
  &-footer {
    @apply row-start-3 text-sm;
  }
  &-bubble {
    @apply relative block w-fit px-4 py-2;
    max-width: 90%;
    &:before {
      @apply absolute bottom-0 h-3 w-3;
      background-color: inherit;
      content: '';
      mask-size: contain;
      mask-repeat: no-repeat;
      mask-position: center;
    }
  }
  &-start {
    @apply place-items-start;
    grid-template-columns: auto 1fr;
    .chat-header {
      @apply col-start-2;
    }
    .chat-footer {
      @apply col-start-2;
    }
    .chat-image {
      @apply col-start-1;
    }
    .chat-bubble {
      @apply col-start-2;
      &:before {
        mask-image: url("data:image/svg+xml,%3csvg width='3' height='3' xmlns='http://www.w3.org/2000/svg'%3e%3cpath fill='black' d='m 0 3 L 3 3 L 3 0 C 3 1 1 3 0 3'/%3e%3c/svg%3e");
        [dir='rtl'] & {
          mask-image: url("data:image/svg+xml,%3csvg width='3' height='3' xmlns='http://www.w3.org/2000/svg'%3e%3cpath fill='black' d='m 0 3 L 1 3 L 3 3 C 2 3 0 1 0 0'/%3e%3c/svg%3e");
        }
      }
    }
  }
  &-end {
    @apply place-items-end;
    grid-template-columns: 1fr auto;
    .chat-header {
      @apply col-start-1;
    }
    .chat-footer {
      @apply col-start-1;
    }
    .chat-image {
      @apply col-start-2;
    }
    .chat-bubble {
      @apply col-start-1;
      &:before {
        mask-image: url("data:image/svg+xml,%3csvg width='3' height='3' xmlns='http://www.w3.org/2000/svg'%3e%3cpath fill='black' d='m 0 3 L 1 3 L 3 3 C 2 3 0 1 0 0'/%3e%3c/svg%3e");
        [dir='rtl'] & {
          mask-image: url("data:image/svg+xml,%3csvg width='3' height='3' xmlns='http://www.w3.org/2000/svg'%3e%3cpath fill='black' d='m 0 3 L 3 3 L 3 0 C 3 1 1 3 0 3'/%3e%3c/svg%3e");
        }
      }
    }
  }
}

.chat {
  &-bubble {
    border-radius: 1.2em;
    min-height: 2.75rem;
    min-width: 2.75rem;

    font-family:
      'SF Pro Display', 'SF Pro Icons', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
    /* letter-spacing: -0.013em; */
    font-size: 18px;
    line-height: 1.43;
    font-weight: 400;
  }

  &-start .chat-bubble {
    @apply rounded-es-none;
    &:before {
      inset-inline-start: -0.749rem;
    }

    --bg-color: #cbd5e1;
    --shiny-color: rgb(255, 255, 255);
    --text-color: rgb(0, 0, 0);

    /* change vars in dark mode */

    background-color: var(--bg-color);
    color: var(--text-color);

    box-shadow:
      var(--bg-color) 3px -3px 0px 0px inset,
      var(--shiny-color) -2px 4px 5px -4px inset;

    @media (prefers-color-scheme: dark) {
      --bg-color: #1e293b;
      --shiny-color: rgb(255, 255, 255);
      --text-color: rgb(255, 255, 255);

      box-shadow:
        var(--bg-color) 3px -3px 0px 0px inset,
        var(--shiny-color) -2px 2px 5px -4px inset;
    }
  }

  &-end .chat-bubble {
    @apply rounded-ee-none;
    &:before {
      inset-inline-start: 99.999%;
    }

    --bg-color: var(--c-blue);
    --shiny-color: rgb(255, 255, 255);
    --text-color: rgb(255, 255, 255);

    /* change vars in dark mode */

    background-color: var(--bg-color);
    color: var(--text-color);

    box-shadow:
      var(--bg-color) -3px -3px 0px 0px inset,
      var(--shiny-color) 4px 4px 5px -4px inset;
  }
}
</style>
