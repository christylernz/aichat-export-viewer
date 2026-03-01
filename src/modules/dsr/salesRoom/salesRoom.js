/**
 * salesRoom.js — The "smart" parent component.
 *
 * ALL state lives here. Child components are intentionally "dumb" —
 * they receive data via @api props and fire CustomEvents upward.
 * This one-way data flow is a core LWC pattern.
 *
 * Drag and drop overview
 * ──────────────────────
 * 1. linkItem fires 'dragstart' → encodes its ID into dataTransfer
 * 2. linkGroup fires 'dragover' → tracks which slot the cursor is near
 * 3. linkGroup fires 'drop'    → dispatches 'linkmoved' event with:
 *      { linkId, targetGroupId, targetOrder }
 * 4. THIS component handles 'linkmoved' and mutates state immutably
 *    so LWC's reactivity system picks up the change.
 */

import { LightningElement, track } from 'lwc';

// ── Tiny ID generator ────────────────────────────────────────────────────────
// We avoid crypto.randomUUID() for broad browser compat in dev.
let _counter = 0;
const uid = (prefix = 'id') => `${prefix}-${++_counter}`;

// ── Fake seed data ───────────────────────────────────────────────────────────
// In a real app this would come from a fetch() or database.
// We fake it here so we can focus purely on the drag and drop mechanics.
const FAKE_LINKS = [
    {
        id: 'link-1',
        groupId: 'group-1',
        order: 0,
        title: 'Product Overview Deck',
        url: 'https://example.com/deck',
        description: 'A 10-slide summary of our platform and key differentiators.',
        image: 'https://picsum.photos/seed/deck/200/120',
        siteName: 'example.com',
        message: 'Start here — this covers everything at a high level.',
    },
    {
        id: 'link-2',
        groupId: 'group-1',
        order: 1,
        title: 'Live Demo Video',
        url: 'https://example.com/demo',
        description: 'A 4-minute walkthrough of the core workflow.',
        image: 'https://picsum.photos/seed/demo/200/120',
        siteName: 'example.com',
        message: null,
    },
    {
        id: 'link-3',
        groupId: 'group-2',
        order: 0,
        title: 'Pricing Page',
        url: 'https://example.com/pricing',
        description: 'Current tiers and add-ons.',
        image: 'https://picsum.photos/seed/price/200/120',
        siteName: 'example.com',
        message: null,
    },
    {
        id: 'link-4',
        groupId: 'group-2',
        order: 1,
        title: 'Security Whitepaper',
        url: 'https://example.com/security',
        description: 'SOC2 Type II, GDPR compliance details.',
        image: 'https://picsum.photos/seed/sec/200/120',
        siteName: 'example.com',
        message: 'Relevant given your enterprise requirements.',
    },
    {
        id: 'link-5',
        groupId: 'group-3',
        order: 0,
        title: 'ROI Calculator',
        url: 'https://example.com/roi',
        description: null,
        image: null,
        siteName: 'example.com',
        message: null,
    },
    {
        id: 'link-6',
        groupId: 'group-3',
        order: 1,
        title: 'Customer Case Study',
        url: 'https://example.com/casestudy',
        description: null,
        image: null,
        siteName: 'example.com',
        message: null,
    },
];

const FAKE_GROUPS = [
    { id: 'group-1', label: 'Getting Started', type: 'full-detail', order: 0 },
    { id: 'group-2', label: 'Due Diligence',   type: 'full-detail', order: 1 },
    { id: 'group-3', label: 'Quick Links',     type: 'short-links', order: 2 },
];

// ── Group type options ────────────────────────────────────────────────────────
// Defined here and passed down as a plain array so linkGroup doesn't need
// to know the full list — easier to extend later.
export const GROUP_TYPES = [
    { label: 'Full Detail', value: 'full-detail' },
    { label: 'Short Links', value: 'short-links' },
    { label: 'Cards',       value: 'cards' },
];

export default class SalesRoom extends LightningElement {
    // @track is needed on objects/arrays so LWC detects deep mutations.
    // Spreading into a new array on every change also guarantees reactivity.
    @track groups = [...FAKE_GROUPS];
    @track links  = [...FAKE_LINKS];

    // ── Computed property for the template ───────────────────────────────────
    // LWC templates cannot call methods with arguments: {myMethod(arg)} won't
    // compile. We must pre-compute everything into a plain array of objects.
    get sortedGroupsWithLinks() {
        return [...this.groups]
            .sort((a, b) => a.order - b.order)
            .map((group) => ({
                ...group,
                // Attach the filtered + sorted links directly to the group object
                // so linkGroup can receive them via a single @api prop.
                links: this.links
                    .filter((l) => l.groupId === group.id)
                    .sort((a, b) => a.order - b.order),
                groupTypes: GROUP_TYPES,
            }));
    }

    // ── Group handlers ────────────────────────────────────────────────────────

    handleAddGroup() {
        const newGroup = {
            id: uid('group'),
            label: 'New Group',
            type: 'full-detail',
            order: this.groups.length, // append to end
        };
        // Spread into new array → LWC sees the change
        this.groups = [...this.groups, newGroup];
    }

    handleGroupChanged(event) {
        // linkGroup fires this when the label or type changes.
        // event.detail = { groupId, field, value }
        const { groupId, field, value } = event.detail;
        this.groups = this.groups.map((g) =>
            g.id === groupId ? { ...g, [field]: value } : g
        );
    }

    handleGroupRemoved(event) {
        const { groupId } = event.detail;
        this.groups = this.groups.filter((g) => g.id !== groupId);
        // Also remove any links that belonged to this group
        this.links  = this.links.filter((l) => l.groupId !== groupId);
        this._normalizeGroupOrders();
    }

    // ── Link handlers ─────────────────────────────────────────────────────────

    handleAddLink(event) {
        // For now we add a fake link so we can test without a modal.
        // Replace the body of this method with real data later.
        const { groupId } = event.detail;
        const groupLinks  = this.links.filter((l) => l.groupId === groupId);

        const fakeLink = {
            id:          uid('link'),
            groupId,
            order:       groupLinks.length,
            title:       `New Link ${uid('t')}`,
            url:         'https://example.com',
            description: 'A placeholder link added for testing.',
            image:       `https://picsum.photos/seed/${uid('img')}/200/120`,
            siteName:    'example.com',
            message:     null,
        };

        this.links = [...this.links, fakeLink];
    }

    handleLinkRemoved(event) {
        const { linkId } = event.detail;
        this.links = this.links.filter((l) => l.id !== linkId);
        this._normalizeAllOrders();
    }

    // ── The core drag and drop handler ────────────────────────────────────────
    //
    // This is where the magic happens. linkGroup fires 'linkmoved' with:
    //   { linkId, targetGroupId, targetOrder }
    //
    // We need to:
    //   1. Remove the link from its current position
    //   2. Re-insert it at (targetGroupId, targetOrder)
    //   3. Normalize order integers for both affected groups
    //   4. Spread into a new array so LWC re-renders

    handleLinkMoved(event) {
        const { linkId, targetGroupId, targetOrder } = event.detail;

        // Find the link being moved
        const movingLink = this.links.find((l) => l.id === linkId);
        if (!movingLink) return;

        // Remove it from the flat list
        const withoutMoving = this.links.filter((l) => l.id !== linkId);

        // Get the target group's links (already without the moving link),
        // sorted so we can splice into the right position.
        const targetLinks = withoutMoving
            .filter((l) => l.groupId === targetGroupId)
            .sort((a, b) => a.order - b.order);

        // The links from every OTHER group — untouched
        const otherLinks = withoutMoving.filter(
            (l) => l.groupId !== targetGroupId
        );

        // Re-assign the moving link to the target group
        const updatedLink = { ...movingLink, groupId: targetGroupId };

        // Splice into position — targetOrder is the 0-based insertion index
        targetLinks.splice(targetOrder, 0, updatedLink);

        // Rewrite order integers sequentially (0, 1, 2 …)
        // This keeps them clean and avoids floating-point drift.
        const reorderedTargetLinks = targetLinks.map((l, i) => ({
            ...l,
            order: i,
        }));

        // Rebuild the full flat list and reassign to @track property
        this.links = [...otherLinks, ...reorderedTargetLinks];
    }

    // Used by the template to show an empty state
    get noGroups() {
        return this.groups.length === 0;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    // Rewrite order integers for every group in the links array.
    _normalizeAllOrders() {
        const byGroup = {};
        this.links.forEach((l) => {
            byGroup[l.groupId] = byGroup[l.groupId] || [];
            byGroup[l.groupId].push(l);
        });

        const normalized = Object.values(byGroup).flatMap((arr) =>
            arr
                .sort((a, b) => a.order - b.order)
                .map((l, i) => ({ ...l, order: i }))
        );

        this.links = normalized;
    }

    // Rewrite group order integers (called after a group is removed).
    _normalizeGroupOrders() {
        const sorted = [...this.groups].sort((a, b) => a.order - b.order);
        this.groups = sorted.map((g, i) => ({ ...g, order: i }));
    }
}
