/**
 * linkItem.js — The draggable leaf component.
 *
 * This component is responsible for:
 *   1. Rendering a single link in one of three display formats
 *   2. Being DRAGGABLE — it encodes its link ID into the drag payload
 *   3. Firing 'linkremoved' when the remove button is clicked
 *
 * Drag payload design
 * ───────────────────
 * We use event.dataTransfer.setData('text/plain', JSON.stringify({...}))
 * because dataTransfer only accepts strings. JSON is the simplest way to
 * pass a structured payload. On drop, linkGroup parses it back out.
 *
 * Why not store the dragged ID in a module-level variable instead?
 * You could, and it would work within the same page, but dataTransfer
 * is the correct API — it works across windows and frames too, and it's
 * what the browser clears automatically when the drag ends.
 *
 * Display types
 * ─────────────
 * The parent (linkGroup) passes down displayType from group.type.
 * This component uses computed boolean getters to pick which template
 * block to render via lwc:if / lwc:elseif / lwc:else.
 */

import { LightningElement, api, track } from 'lwc';

export default class LinkItem extends LightningElement {
    // ── Props from parent ─────────────────────────────────────────────────────
    @api link;        // { id, title, url, description, image, siteName, message }
    @api displayType; // 'full-detail' | 'short-links' | 'cards'

    // ── Local drag state ──────────────────────────────────────────────────────
    // We use @track here because isDragging affects a class binding.
    @track isDragging = false;

    // ── Drag handlers ─────────────────────────────────────────────────────────

    handleDragStart(event) {
        // STEP 1: Tell the browser what kind of drag this is
        event.dataTransfer.effectAllowed = 'move';

        // STEP 2: Encode the payload. The drop handler in linkGroup will
        //         parse this back out to know which link was dropped.
        event.dataTransfer.setData(
            'text/plain',
            JSON.stringify({ linkId: this.link.id })
        );

        // STEP 3: Apply the dragging style AFTER a short delay.
        // If we set it synchronously, the drag ghost image captures the
        // faded-out state, which looks wrong. The timeout lets the browser
        // capture the normal appearance first.
        setTimeout(() => {
            this.isDragging = true;
        }, 0);
    }

    handleDragEnd() {
        // Always clean up — dragend fires whether the drop succeeded or not.
        this.isDragging = false;
    }

    // ── Remove handler ────────────────────────────────────────────────────────

    handleRemove() {
        this.dispatchEvent(
            new CustomEvent('linkremoved', {
                bubbles:  true,
                composed: true, // needed to cross shadow DOM boundaries
                detail:   { linkId: this.link.id },
            })
        );
    }

    // ── Display type getters ──────────────────────────────────────────────────
    // These drive the lwc:if / lwc:elseif blocks in the template.
    // Keeping the logic in JS (not the template) makes the template readable.

    get isFullDetail() {
        return this.displayType === 'full-detail' || !this.displayType;
    }

    get isShortLinks() {
        return this.displayType === 'short-links';
    }

    get isCards() {
        return this.displayType === 'cards';
    }

    // ── Computed class ────────────────────────────────────────────────────────

    get itemClass() {
        return `link-item${this.isDragging ? ' link-item_dragging' : ''}`;
    }

    // ── Convenience getters for the template ─────────────────────────────────

    get hasImage() {
        return !!this.link.image;
    }

    get hasDescription() {
        return !!this.link.description;
    }

    get hasMessage() {
        return !!this.link.message;
    }
}
