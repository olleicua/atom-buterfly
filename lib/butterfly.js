'use babel';

import ButterflyView from './butterfly-view';
import { CompositeDisposable } from 'atom';

export default {

  butterflyView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.butterflyView = new ButterflyView(state.butterflyViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.butterflyView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'butterfly:flip-bit': () => this.flipBit()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.butterflyView.destroy();
  },

  serialize() {
    return {
      butterflyViewState: this.butterflyView.serialize()
    };
  },

  flipBit() {
    const editor = atom.workspace.getActiveTextEditor();

    editor.element.style.zIndex = 3;
    editor.element.style.opacity = 0;

    const butterfly = document.createElement('div');
    butterfly.classList.add('butterfly-image');
    butterfly.style.zIndex = 2;
    butterfly.style.opacity = 0;
    editor.element.after(butterfly);

    butterfly.animate([
      { opacity: 0 },
      { opacity: 1 }
    ], {
      duration: 2000,
      fill: 'forwards'
    });

    setTimeout(function() {
      const editorSubscription = editor.observeCursors(function(cursor) {
        const cursorSubscription = cursor.onDidChangePosition(function(event) {
          setTimeout(function() {
            editorSubscription.dispose();
            cursorSubscription.dispose();
            const cursor = editor.element.querySelector('.cursor');
            const cursorBoundingBox = cursor.getBoundingClientRect();
            const butterflyBoundingBox = butterfly.getBoundingClientRect();
            const destinationX = cursorBoundingBox.left - butterflyBoundingBox.left;
            const destinationY = cursorBoundingBox.top - butterflyBoundingBox.top;
            editor.element.style.zIndex = 1;
            editor.element.style.opacity = 1;
            butterfly.animate([
              {
                transform: 'translateY(0px) translateX(0px)',
                opacity: 1,
                height: butterfly.height + 'px',
                width: butterfly.width + 'px'
              }, {
                transform: 'translateY(' + destinationY + 'px) ' +
                  'translateX(' + destinationX + 'px)',
                opacity: 0,
                height: '0px',
                width: '0px'
              }
            ], {
              duration: 3000,
              fill: 'forwards'
            });
            setTimeout(function() {
              const byteRange = [event.newBufferPosition, event.newBufferPosition.translate([0, 1])];
              const byte = editor.getTextInBufferRange(byteRange);
              let newByte;
              if (byte.length === 1) {
                newByte = String.fromCharCode(byte.charCodeAt(0) ^ (1 << Math.floor(Math.random() * 7)));
              } else {
                newByte = String.fromCharCode(1 << Math.floor(Math.random() * 7));
              }
              editor.setTextInBufferRange(byteRange, newByte);
            }, 3100);
          }, 100);
        });
      });
    }, 2100)
  }
};
