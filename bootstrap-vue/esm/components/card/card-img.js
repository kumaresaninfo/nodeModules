import Vue, { mergeData } from '../../vue';
import { NAME_CARD_IMG } from '../../constants/components';
export var props = {
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: null
  },
  top: {
    type: Boolean,
    default: false
  },
  bottom: {
    type: Boolean,
    default: false
  },
  start: {
    type: Boolean,
    default: false
  },
  left: {
    // alias of 'start'
    type: Boolean,
    default: false
  },
  end: {
    type: Boolean,
    default: false
  },
  right: {
    // alias of 'end'
    type: Boolean,
    default: false
  },
  height: {
    type: [Number, String] // default: null

  },
  width: {
    type: [Number, String] // default: null

  }
}; // @vue/component

export var BCardImg = /*#__PURE__*/Vue.extend({
  name: NAME_CARD_IMG,
  functional: true,
  props: props,
  render: function render(h, _ref) {
    var props = _ref.props,
        data = _ref.data;
    var baseClass = 'card-img';

    if (props.top) {
      baseClass += '-top';
    } else if (props.right || props.end) {
      baseClass += '-right';
    } else if (props.bottom) {
      baseClass += '-bottom';
    } else if (props.left || props.start) {
      baseClass += '-left';
    }

    return h('img', mergeData(data, {
      class: [baseClass],
      attrs: {
        src: props.src || null,
        alt: props.alt,
        height: props.height || null,
        width: props.width || null
      }
    }));
  }
});