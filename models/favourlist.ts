/* models/favourlist.ts */
export interface Favour {
    id: number;
    memberId: number;
    hotelId: number;
    }
    
    export class FavourListModel {
    private static favours: Favour[] = [];
    
    // Add a hotel to a member's favourites
    static addFavour(memberId: number, hotelId: number): Favour {
    const newFavour: Favour = {
    id: this.favours.length + 1,
    memberId,
    hotelId,
    };
    this.favours.push(newFavour);
    return newFavour;
    }
    
    // Update an existing favourite entry
    static updateFavour(id: number, data: Partial<Favour>): Favour | null {
    const favour = this.favours.find(f => f.id === id);
    if (!favour) return null;
    if (data.memberId !== undefined) favour.memberId = data.memberId;
    if (data.hotelId !== undefined) favour.hotelId = data.hotelId;
    return favour;
    }
    
    // Remove a favourite entry
    static deleteFavour(id: number): boolean {
    const index = this.favours.findIndex(f => f.id === id);
    if (index === -1) return false;
    this.favours.splice(index, 1);
    return true;
    }
    
    // Retrieve all favourite entries
    static getAllFavours(): Favour[] {
    return this.favours;
    }
    }