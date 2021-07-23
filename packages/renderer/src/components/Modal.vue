<template>
  <TransitionRoot
    as="template"
    :show="open"
  >
    <Dialog
      as="div"
      static
      class="fixed z-10 inset-0 overflow-y-auto"
      :open="open"
      @close="closeDialog"
    >
      <div
        class="
          flex
          items-end
          justify-center
          min-h-screen
          pt-4
          px-4
          pb-20
          text-center
          sm:block sm:p-0
        "
      >
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <DialogOverlay
            class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          />
        </TransitionChild>

        <!-- This element is to trick the browser into centering the modal contents. -->
        <span
          class="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >&#8203;</span>
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enter-to="opacity-100 translate-y-0 sm:scale-100"
          leave="ease-in duration-200"
          leave-from="opacity-100 translate-y-0 sm:scale-100"
          leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <div
            class="
              inline-block
              align-bottom
              bg-white
              rounded-lg
              text-left
              overflow-hidden
              shadow-xl
              transform
              transition-all
              sm:my-8 sm:align-middle sm:max-w-lg sm:w-full
            "
          >
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div class="sm:flex sm:items-start">
                <slot name="body">
                  <div
                    class="
                      mx-auto
                      flex-shrink-0 flex
                      items-center
                      justify-center
                      h-12
                      w-12
                      rounded-full
                      bg-red-100
                      sm:mx-0 sm:h-10 sm:w-10
                    "
                  >
                    <ExclamationIcon
                      class="h-6 w-6 text-red-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <DialogTitle
                      as="h3"
                      class="text-lg leading-6 font-medium text-gray-900"
                    >
                      Dialog
                    </DialogTitle>
                    <div class="mt-2">
                      <p class="text-sm text-gray-500">
                        Stuff goes here
                      </p>
                    </div>
                  </div>
                </slot>
              </div>
            </div>
            <div
              class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"
            >
              <slot
                name="buttons"
                :closefunc="closeDialog"
              >
                <button
                  type="button"
                  class="
                    w-full
                    inline-flex
                    justify-center
                    rounded-md
                    border border-transparent
                    shadow-sm
                    px-4
                    py-2
                    bg-green-600
                    text-base
                    font-medium
                    text-white
                    hover:bg-green-700
                    focus:outline-none
                    focus:ring-2
                    focus:ring-offset-2
                    focus:ring-green-500
                    sm:ml-3 sm:w-auto sm:text-sm
                  "
                  @click="closeDialog"
                >
                  Save
                </button>
                <button
                  ref="cancelButtonRef"
                  type="button"
                  class="
                    mt-3
                    w-full
                    inline-flex
                    justify-center
                    rounded-md
                    border border-gray-300
                    shadow-sm
                    px-4
                    py-2
                    bg-white
                    text-base
                    font-medium
                    text-gray-700
                    hover:bg-gray-50
                    focus:outline-none
                    focus:ring-2
                    focus:ring-offset-2
                    focus:ring-indigo-500
                    sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm
                  "
                  @click="closeDialog"
                >
                  Cancel
                </button>
              </slot>
            </div>
          </div>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script lang="ts">
import {
  Dialog,
  DialogOverlay,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue';
// @ts-expect-error: heroicons have no declaration
import { ExclamationIcon } from '@heroicons/vue/outline';

export default {
  components: {
    Dialog,
    DialogOverlay,
    DialogTitle,
    TransitionChild,
    TransitionRoot,
    ExclamationIcon,
  },
  props: {
    open: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  emits: ['update:open'],
  // @ts-expect-error: vue props can be inferred safely
  setup(props, { emit }) {
    function closeDialog() {
      emit('update:open', false);
    }
    return { closeDialog };
  },
};
</script>
