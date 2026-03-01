import { TestBed } from '@angular/core/testing';
import { GiftService } from './gift.service';

describe('GiftService', () => {
    let service: GiftService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GiftService);
        // Clear localStorage before each test to ensure isolation
        localStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should add a contact', async () => {
        const contact = {
            name: 'John Doe',
            initials: 'JD',
            avatarColor: 'red'
        };
        const id = await service.addContact(contact);
        expect(id).toBeDefined();

        const retrieved = service.getContact(id);
        expect(retrieved).toBeDefined();
        expect(retrieved?.name).toBe('John Doe');
    });

    it('should add a gift for a contact', async (done) => {
        const contactId = await service.addContact({ name: 'Alice', initials: 'A', avatarColor: 'blue' });

        const gift = {
            contactId,
            type: 'given' as const,
            item: 'Book',
            date: new Date().toISOString()
        };

        await service.addGift(gift);

        service.getGiftsForContact(contactId).subscribe(gifts => {
            expect(gifts.length).toBe(1);
            expect(gifts[0].item).toBe('Book');
            expect(gifts[0].type).toBe('given');
            done();
        });
    });

    // Test for new feature: update contact name
    it('should update contact name', async () => {
        const id = await service.addContact({ name: 'Bob', initials: 'B', avatarColor: 'green' });

        await service.updateContactName(id, 'Bobby');

        const updated = service.getContact(id);
        expect(updated?.name).toBe('Bobby');
        expect(updated?.initials).toBe('B'); // Single name results in single initial
    });
});
