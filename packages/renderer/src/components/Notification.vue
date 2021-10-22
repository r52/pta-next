<template>
  <div>
    <TransitionRoot
      appear
      :show="modelValue"
      as="template"
      enter="transform transition duration-[400ms]"
      enter-from="opacity-0 rotate-[-120deg] scale-50"
      enter-to="opacity-100 rotate-0 scale-100"
      leave="transform duration-200 transition ease-in-out"
      leave-from="opacity-100 rotate-0 scale-100 "
      leave-to="opacity-0 scale-95 "
    >
      <div
        class="shadow-lg rounded-lg bg-white mx-auto m-8 p-4 flex items-center"
      >
        <div class="pr-2">
          <slot name="icon">
            <CheckCircleIcon class="w-8 h-8 text-green-600" />
          </slot>
        </div>
        <div>
          <slot name="content">
            <div class="text-sm text-black">
              Notification Title
            </div>
            <div class="text-sm text-gray-600 tracking-tight">
              Some very very very very very very very very very very very very
              very very very very long text.
            </div>
          </slot>
        </div>
        <div class="flex-grow" />
        <div>
          <button
            type="button"
            class="
              inline-flex
              items-center
              border border-transparent
              rounded-sm
              text-white
              hover:bg-gray-400
            "
            @click="closeNotification"
          >
            <XIcon class="text-gray-600 w-4 h-4" />
          </button>
        </div>
      </div>
    </TransitionRoot>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { TransitionRoot } from '@headlessui/vue';
import { XIcon, CheckCircleIcon } from '@heroicons/vue/solid';

export default defineComponent({
  components: { TransitionRoot, XIcon, CheckCircleIcon },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    function closeNotification() {
      emit('update:modelValue', false);
    }

    return {
      closeNotification,
    };
  },
});
</script>
