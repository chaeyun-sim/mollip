import { supabase } from '@/src/utils/supabase';

const BUCKET = 'visit-photos';

const uploadOne = async (
	userId: string,
	dateKey: string,
	name: string,
	uri: string,
): Promise<string> => {
	const response = await fetch(uri);
	if (!response.ok) throw new Error('사진을 읽지 못했어요');
	const body = await response.arrayBuffer();
	const path = `${userId}/${dateKey}/${name}.jpg`;
	const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
		contentType: 'image/jpeg',
		upsert: true,
	});
	if (error) throw error;
	const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
	return data.publicUrl;
};

export const uploadTicketVisitPhotos = async (
	userId: string,
	dateKey: string,
	ticketUri: string,
	venueUris: string[],
): Promise<{ ticketUrl: string; venueUrls: string[] }> => {
	const ticketUrl = await uploadOne(userId, dateKey, 'ticket', ticketUri);
	const venueUrls = await Promise.all(
		venueUris.map((uri, index) => uploadOne(userId, dateKey, `venue-${index}`, uri)),
	);
	return { ticketUrl, venueUrls };
};
