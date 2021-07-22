<template>
  <div class="flex flex-col">
    <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
        <div
          class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg"
        >
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <slot
                  name="header"
                  :cols="columns"
                >
                  <th
                    v-for="clm in columns"
                    :key="clm.name"
                    scope="col"
                    class="
                      px-6
                      py-3
                      text-left text-xs
                      font-medium
                      text-gray-500
                      uppercase
                      tracking-wider
                    "
                  >
                    {{ clm.label }}
                  </th>
                </slot>
                <th
                  scope="col"
                  class="relative px-6 py-3"
                >
                  <span class="sr-only">Edit</span>
                </th>
                <th
                  scope="col"
                  class="
                    relative
                    px-6
                    py-4
                    whitespace-nowrap
                    text-right text-sm
                    font-medium
                  "
                >
                  <a
                    href="#"
                    class="text-indigo-600 hover:text-indigo-900"
                    @click="emitEvent($event, 'add')"
                  >Add New</a>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <template v-if="modelValue.length > 0">
                <tr
                  v-for="row in modelValue"
                  :key="row[rowKey]"
                >
                  <slot
                    name="body"
                    :row="row"
                  >
                    <td
                      v-for="clm in columns"
                      :key="clm.name"
                      class="px-6 py-4 whitespace-nowrap"
                    >
                      <div class="text-sm text-gray-900">
                        {{ row[clm.field] }}
                      </div>
                    </td>
                  </slot>
                  <td
                    class="
                      px-6
                      py-4
                      whitespace-nowrap
                      text-right text-sm
                      font-medium
                    "
                  >
                    <a
                      href="#"
                      class="text-indigo-600 hover:text-indigo-900"
                      @click="emitEvent($event, 'edit', row)"
                    >Edit</a>
                  </td>

                  <td
                    class="
                      px-6
                      py-4
                      whitespace-nowrap
                      text-right text-sm
                      font-medium
                    "
                  >
                    <a
                      href="#"
                      class="text-indigo-600 hover:text-indigo-900"
                      @click="emitEvent($event, 'remove', row)"
                    >Remove</a>
                  </td>
                </tr>
              </template>
              <template v-else>
                <tr>
                  <td
                    class="px-6 py-4 whitespace-nowrap"
                    :colspan="columns.length + 2"
                  >
                    <span
                      class="inline-flex items-center space-x-1"
                    ><ExclamationIcon class="w-6 h-6 text-yellow-400" />
                      <div class="text-sm text-gray-900">No items!</div>
                    </span>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { ExclamationIcon } from '@heroicons/vue/solid';

interface ColumnType {
  name: string;
  label: string;
  field: string;
}

type Emits = 'update:modelValue' | 'add' | 'remove' | 'edit';

export default {
  components: {
    ExclamationIcon,
  },
  props: {
    modelValue: {
      type: Array,
      required: true,
      default() {
        return [];
      },
    },
    columns: {
      type: Array as PropType<ColumnType[]>,
      required: true,
      default() {
        return [];
      },
    },
    rowKey: {
      type: String,
      required: true,
      default: 'id',
    },
  },

  emits: ['update:modelValue', 'add', 'remove', 'edit'],

  setup(props, { emit }) {
    function emitEvent(e: Event, event: Emits, data?: any) {
      emit(event, data);
      e.preventDefault();
    }

    return { emitEvent };
  },
};
</script>
