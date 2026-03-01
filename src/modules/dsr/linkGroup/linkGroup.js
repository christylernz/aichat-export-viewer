/**
 * linkGroup.js — The drop zone component.
 *
 * This component is responsible for:
 *   1. Receiving a 'group' object and a 'links' array via @api props
 *   2. Rendering links via dsr-link-item children
 *   3. Acting as a DROP ZONE for the HTML5 drag-and-drop API
 *   4. Tracking WHERE in the list the dragged item would land (dragOverIndex)
 *   5. Showing a visual placeholder at that position while dragging
 *   6. Firing 'linkmoved' upward on drop so the parent can mutate state
 *
 * It also handles:
 *   - Inline label editing (click to rename)
 *   - Group type switching (full-detail / short-links / cards)
 *   - Group deletion
 *   - Adding a new link (just fires the event — parent decides what link to add)
 *
 * What this component does NOT do:
 *   - Mutate any state directly (it has no @track state for links/groups)
 *   - Know anything about other groups
 *   - Handle the drag START (that's in linkItem)
 */

import { LightningElement, api, track } from 'lwc';

export default class LinkGroup extends LightningElement {
    // ── Props from parent ─────────────────────────────────────────────────────
    // group = { id, label, type, order }
    // The parent attaches .links and .groupTypes to the group object directly
    // so we only need a single @api.
    @api group;

    // ── Local drag state ──────────────────────────────────────────────────────
    // These are NOT in @track because we only need them during a live drag.
    // They affect CSS classes (computed in getters) and the placeholder slot.
    isDragOver   = false; // true while a draggable is over this group
    dragOverIndex = -1;   // which slot index the cursor is hovering over

    // ── Local label-editing state ─────────────────────────────────────────────
    @track isEditingLabel  = false;
    @track editLabelValue  = '';

    // ── Template computed properties ──────────────────────────────────────────

    // Insert a placeholder object at dragOverIndex so the template can render
    // a visual gap showing where the item will land.
    // When not dragging (dragOverIndex === -1) this just returns links as-is.
    get linksWithPlaceholder() {
        if (this.dragOverIndex < 0 || !this.isDragOver) {
            return this.group.links;
        }

        const arr = [...this.group.links];

        // Splice in a sentinel object — the template checks for __isPlaceholder
        arr.splice(this.dragOverIndex, 0, {
            id: '__placeholder',
            __isPlaceholder: true,
        });

        return arr;
    }

    get isEmpty() {
        return !(!this.group.links || this.group.links.length === 0);
    }

    get groupCardClass() {
        // Add a drag-over modifier class for the highlight ring
        return `slds-card group-card${this.isDragOver ? ' group-card_drag-over' : ''}`;
    }

    // ── Label editing ─────────────────────────────────────────────────────────

    handleLabelClick() {
        this.editLabelValue = this.group.label;
        this.isEditingLabel = true;

        // Focus the input on the next tick after LWC renders it
        // requestAnimationFrame is reliable and doesn't need @salesforce/* imports
        requestAnimationFrame(() => {
            const input = this.template.querySelector('.js-label-input');
            if (input) input.focus();
        });
    }

    handleLabelInput(event) {
        this.editLabelValue = event.target.value;
    }

    handleLabelBlur() {
        this._commitLabel();
    }

    handleLabelKeydown(event) {
        if (event.key === 'Enter')  this._commitLabel();
        if (event.key === 'Escape') this.isEditingLabel = false;
    }

    _commitLabel() {
        this.isEditingLabel = false;
        const trimmed = this.editLabelValue.trim();
        if (trimmed && trimmed !== this.group.label) {
            this._dispatchGroupChanged('label', trimmed);
        }
    }

    // ── Group type selector ───────────────────────────────────────────────────

    handleTypeChange(event) {
        this._dispatchGroupChanged('type', event.target.value);
    }

    // ── Toolbar actions ───────────────────────────────────────────────────────

    handleAddLink() {
        this.dispatchEvent(
            new CustomEvent('linkadded', {
                bubbles:  true,
                composed: true,
                detail:   { groupId: this.group.id },
            })
        );
    }

    handleRemoveGroup() {
        this.dispatchEvent(
            new CustomEvent('groupremoved', {
                bubbles:  true,
                composed: true,
                detail:   { groupId: this.group.id },
            })
        );
    }

    // ── Drag and Drop event handlers ──────────────────────────────────────────
    //
    // The HTML5 DnD sequence is: dragenter → dragover (repeating) → drop / dragleave
    //
    // IMPORTANT: You MUST call event.preventDefault() in ondragover for
    // the ondrop event to fire. Without it the browser treats the target
    // as "not droppable" and cancels the drop.

    handleDragOver(event) {
        event.preventDefault(); // ← Required to allow dropping
        event.dataTransfer.dropEffect = 'move';

        this.isDragOver = true;

        // ── Work out where in the list the cursor is ──────────────────────────
        // We find all rendered link item wrappers, measure their midpoints,
        // and find the first one whose midpoint is below the cursor.
        // That index becomes our insertion point.
        //
        // [item 0 midpoint]  cursor above → insert at 0
        // [item 1 midpoint]  cursor above → insert at 1
        //                    cursor at end → insert at items.length

        const itemEls = [
            ...this.template.querySelectorAll('[data-link-index]'),
        ];

        let newIndex = this.group.links.length; // default: insert at end

        for (const el of itemEls) {
            const rect  = el.getBoundingClientRect();
            const midY  = rect.top + rect.height / 2;
            if (event.clientY < midY) {
                newIndex = parseInt(el.dataset.linkIndex, 10);
                break;
            }
        }

        this.dragOverIndex = newIndex;
    }

    handleDragLeave(event) {
        // dragleave fires for EVERY child element the cursor crosses —
        // we only want to clear state when the cursor truly leaves this group.
        // Checking relatedTarget (where the cursor is going) does that.
        if (!this.template.host.contains(event.relatedTarget)) {
            this.isDragOver    = false;
            this.dragOverIndex = -1;
        }
    }

    handleDrop(event) {
        event.preventDefault();

        // Parse the payload set in linkItem's dragstart handler
        let payload;
        try {
            payload = JSON.parse(event.dataTransfer.getData('text/plain'));
        } catch {
            return; // Ignore drops from foreign draggables
        }

        const targetOrder = this.dragOverIndex >= 0
            ? this.dragOverIndex
            : this.group.links.length;

        // Reset drag state immediately so the placeholder disappears
        this.isDragOver    = false;
        this.dragOverIndex = -1;

        // Fire upward — the parent will mutate state
        this.dispatchEvent(
            new CustomEvent('linkmoved', {
                bubbles:  true,
                composed: true,
                detail: {
                    linkId:        payload.linkId,
                    targetGroupId: this.group.id,
                    targetOrder,
                },
            })
        );
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    _dispatchGroupChanged(field, value) {
        this.dispatchEvent(
            new CustomEvent('groupchanged', {
                bubbles:  true,
                composed: true,
                detail:   { groupId: this.group.id, field, value },
            })
        );
    }
}
