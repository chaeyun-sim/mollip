export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: '14.15';
	};
	public: {
		Tables: {
			account_deletion_feedback: {
				Row: {
					created_at: string;
					detail: string | null;
					id: string;
					reason: string;
				};
				Insert: {
					created_at?: string;
					detail?: string | null;
					id?: string;
					reason: string;
				};
				Update: {
					created_at?: string;
					detail?: string | null;
					id?: string;
					reason?: string;
				};
				Relationships: [];
			};
			app_min_version: {
				Row: {
					min_version: string;
					platform: string;
					store_url: string | null;
					updated_at: string;
				};
				Insert: {
					min_version: string;
					platform: string;
					store_url?: string | null;
					updated_at?: string;
				};
				Update: {
					min_version?: string;
					platform?: string;
					store_url?: string | null;
					updated_at?: string;
				};
				Relationships: [];
			};
			artist_artworks: {
				Row: {
					artist: string;
					artworks: Json;
					updated_at: string;
				};
				Insert: {
					artist: string;
					artworks?: Json;
					updated_at?: string;
				};
				Update: {
					artist?: string;
					artworks?: Json;
					updated_at?: string;
				};
				Relationships: [];
			};
			artist_intros: {
				Row: {
					artist: string;
					intro: string;
					updated_at: string;
				};
				Insert: {
					artist: string;
					intro: string;
					updated_at?: string;
				};
				Update: {
					artist?: string;
					intro?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			audio_guides: {
				Row: {
					artist: string | null;
					chat_messages: Json | null;
					created_at: string;
					full_text: string;
					id: string;
					image_url: string | null;
					title: string;
					user_id: string;
				};
				Insert: {
					artist?: string | null;
					chat_messages?: Json | null;
					created_at?: string;
					full_text?: string;
					id?: string;
					image_url?: string | null;
					title: string;
					user_id: string;
				};
				Update: {
					artist?: string | null;
					chat_messages?: Json | null;
					created_at?: string;
					full_text?: string;
					id?: string;
					image_url?: string | null;
					title?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			bookmark_audio: {
				Row: {
					audio_guide_id: string | null;
					created_at: string;
					id: string;
					user_id: string;
				};
				Insert: {
					audio_guide_id?: string | null;
					created_at?: string;
					id?: string;
					user_id: string;
				};
				Update: {
					audio_guide_id?: string | null;
					created_at?: string;
					id?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'bookmark_audio_audio_guide_id_fkey';
						columns: ['audio_guide_id'];
						isOneToOne: false;
						referencedRelation: 'audio_guides';
						referencedColumns: ['id'];
					},
				];
			};
			bookmark_exhibitions: {
				Row: {
					created_at: string;
					exhibition_id: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					exhibition_id: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					exhibition_id?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			data_sync_meta: {
				Row: {
					source: string;
					synced_at: string;
				};
				Insert: {
					source: string;
					synced_at?: string;
				};
				Update: {
					source?: string;
					synced_at?: string;
				};
				Relationships: [];
			};
			exhibition_views: {
				Row: {
					created_at: string;
					exhibition_id: string;
					user_id: string;
					viewed_date: string;
				};
				Insert: {
					created_at?: string;
					exhibition_id: string;
					user_id: string;
					viewed_date?: string;
				};
				Update: {
					created_at?: string;
					exhibition_id?: string;
					user_id?: string;
					viewed_date?: string;
				};
				Relationships: [];
			};
			exhibitions: {
				Row: {
					admission: string | null;
					artist: string | null;
					closed_days: string | null;
					collected_date: string | null;
					created_at: string;
					description: string;
					description_en: string | null;
					end_date: string | null;
					event_site: string | null;
					genre: string | null;
					id: number;
					image_url: string | null;
					museum_id: number | null;
					note: string | null;
					open_hours: string;
					source: string;
					start_date: string;
					synced_at: string | null;
					tags: string | null;
					ticket_url: string | null;
					title: string;
					title_en: string | null;
					type: string | null;
					updated_at: string;
					venue_name_fallback: string;
					web_site: string | null;
				};
				Insert: {
					admission?: string | null;
					artist?: string | null;
					closed_days?: string | null;
					collected_date?: string | null;
					created_at?: string;
					description?: string;
					description_en?: string | null;
					end_date?: string | null;
					event_site?: string | null;
					genre?: string | null;
					id?: number;
					image_url?: string | null;
					museum_id?: number | null;
					note?: string | null;
					open_hours?: string;
					source?: string;
					start_date: string;
					synced_at?: string | null;
					tags?: string | null;
					ticket_url?: string | null;
					title: string;
					title_en?: string | null;
					type?: string | null;
					updated_at?: string;
					venue_name_fallback: string;
					web_site?: string | null;
				};
				Update: {
					admission?: string | null;
					artist?: string | null;
					closed_days?: string | null;
					collected_date?: string | null;
					created_at?: string;
					description?: string;
					description_en?: string | null;
					end_date?: string | null;
					event_site?: string | null;
					genre?: string | null;
					id?: number;
					image_url?: string | null;
					museum_id?: number | null;
					note?: string | null;
					open_hours?: string;
					source?: string;
					start_date?: string;
					synced_at?: string | null;
					tags?: string | null;
					ticket_url?: string | null;
					title?: string;
					title_en?: string | null;
					type?: string | null;
					updated_at?: string;
					venue_name_fallback?: string;
					web_site?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'exhibitions_museum_id_fkey';
						columns: ['museum_id'];
						isOneToOne: false;
						referencedRelation: 'museums';
						referencedColumns: ['id'];
					},
				];
			};
			inquiries: {
				Row: {
					category: string;
					contact: string | null;
					content: string;
					created_at: string;
					id: string;
				};
				Insert: {
					category?: string;
					contact?: string | null;
					content: string;
					created_at?: string;
					id?: string;
				};
				Update: {
					category?: string;
					contact?: string | null;
					content?: string;
					created_at?: string;
					id?: string;
				};
				Relationships: [];
			};
			museums: {
				Row: {
					accessibility: string | null;
					address: string | null;
					address_en: string | null;
					admission: string | null;
					amenities: string | null;
					created_at: string;
					gps_x: string | null;
					gps_y: string | null;
					homepage_url: string | null;
					id: number;
					name: string;
					name_en: string | null;
					notes: string | null;
					open_hours: string | null;
					open_hours_en: string | null;
					parking: string | null;
					phone: string | null;
					rstdeInfo: string | null;
					rstdeInfo_en: string | null;
					synced_at: string | null;
					updated_at: string;
				};
				Insert: {
					accessibility?: string | null;
					address?: string | null;
					address_en?: string | null;
					admission?: string | null;
					amenities?: string | null;
					created_at?: string;
					gps_x?: string | null;
					gps_y?: string | null;
					homepage_url?: string | null;
					id?: number;
					name: string;
					name_en?: string | null;
					notes?: string | null;
					open_hours?: string | null;
					open_hours_en?: string | null;
					parking?: string | null;
					phone?: string | null;
					rstdeInfo?: string | null;
					rstdeInfo_en?: string | null;
					synced_at?: string | null;
					updated_at?: string;
				};
				Update: {
					accessibility?: string | null;
					address?: string | null;
					address_en?: string | null;
					admission?: string | null;
					amenities?: string | null;
					created_at?: string;
					gps_x?: string | null;
					gps_y?: string | null;
					homepage_url?: string | null;
					id?: number;
					name?: string;
					name_en?: string | null;
					notes?: string | null;
					open_hours?: string | null;
					open_hours_en?: string | null;
					parking?: string | null;
					phone?: string | null;
					rstdeInfo?: string | null;
					rstdeInfo_en?: string | null;
					synced_at?: string | null;
					updated_at?: string;
				};
				Relationships: [];
			};
			notices: {
				Row: {
					body: string;
					category: string;
					created_at: string;
					id: string;
					title: string;
				};
				Insert: {
					body: string;
					category?: string;
					created_at?: string;
					id?: string;
					title: string;
				};
				Update: {
					body?: string;
					category?: string;
					created_at?: string;
					id?: string;
					title?: string;
				};
				Relationships: [];
			};
			notification_jobs: {
				Row: {
					attempts: number;
					created_at: string;
					dedupe_key: string;
					id: string;
					kind: string;
					last_error: string | null;
					payload: Json;
					processed_at: string | null;
					send_at: string;
					status: string;
				};
				Insert: {
					attempts?: number;
					created_at?: string;
					dedupe_key: string;
					id?: string;
					kind: string;
					last_error?: string | null;
					payload: Json;
					processed_at?: string | null;
					send_at: string;
					status?: string;
				};
				Update: {
					attempts?: number;
					created_at?: string;
					dedupe_key?: string;
					id?: string;
					kind?: string;
					last_error?: string | null;
					payload?: Json;
					processed_at?: string | null;
					send_at?: string;
					status?: string;
				};
				Relationships: [];
			};
			notification_logs: {
				Row: {
					body: string;
					created_at: string;
					data: Json | null;
					id: string;
					read_at: string | null;
					title: string;
					type: string;
					user_id: string;
				};
				Insert: {
					body: string;
					created_at?: string;
					data?: Json | null;
					id?: string;
					read_at?: string | null;
					title?: string;
					type: string;
					user_id: string;
				};
				Update: {
					body?: string;
					created_at?: string;
					data?: Json | null;
					id?: string;
					read_at?: string | null;
					title?: string;
					type?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			profiles: {
				Row: {
					avatar_url: string | null;
					created_at: string;
					display_name: string | null;
					id: string;
					is_premium: boolean;
					notification_prefs: Json;
					onboarding_completed: boolean;
					preferred_artists: string[];
					preferred_genres: string[];
					preferred_taste_details: Json;
					preferred_wall_piece_ids: string[];
					push_token: string | null;
					updated_at: string;
				};
				Insert: {
					avatar_url?: string | null;
					created_at?: string;
					display_name?: string | null;
					id: string;
					is_premium?: boolean;
					notification_prefs?: Json;
					onboarding_completed?: boolean;
					preferred_artists?: string[];
					preferred_genres?: string[];
					preferred_taste_details?: Json;
					preferred_wall_piece_ids?: string[];
					push_token?: string | null;
					updated_at?: string;
				};
				Update: {
					avatar_url?: string | null;
					created_at?: string;
					display_name?: string | null;
					id?: string;
					is_premium?: boolean;
					notification_prefs?: Json;
					onboarding_completed?: boolean;
					preferred_artists?: string[];
					preferred_genres?: string[];
					preferred_taste_details?: Json;
					preferred_wall_piece_ids?: string[];
					push_token?: string | null;
					updated_at?: string;
				};
				Relationships: [];
			};
			venue_follows: {
				Row: {
					created_at: string;
					museum_id: number;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					museum_id: number;
					user_id: string;
				};
				Update: {
					created_at?: string;
					museum_id?: number;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'venue_follows_museum_id_fkey';
						columns: ['museum_id'];
						isOneToOne: false;
						referencedRelation: 'museums';
						referencedColumns: ['id'];
					},
				];
			};
			visits: {
				Row: {
					date: string;
					exhibition_id: number | null;
					exhibition_title: string | null;
					memo: string | null;
					ticket_photo_url: string | null;
					user_id: string;
					venue: string | null;
					venue_photo_urls: string[];
					visit_ended_at: string | null;
					visit_key: string;
					visit_started_at: string | null;
					visit_status: string;
				};
				Insert: {
					date: string;
					exhibition_id?: number | null;
					exhibition_title?: string | null;
					memo?: string | null;
					ticket_photo_url?: string | null;
					user_id: string;
					venue?: string | null;
					venue_photo_urls?: string[];
					visit_ended_at?: string | null;
					visit_key: string;
					visit_started_at?: string | null;
					visit_status?: string;
				};
				Update: {
					date?: string;
					exhibition_id?: number | null;
					exhibition_title?: string | null;
					memo?: string | null;
					ticket_photo_url?: string | null;
					user_id?: string;
					venue?: string | null;
					venue_photo_urls?: string[];
					visit_ended_at?: string | null;
					visit_key?: string;
					visit_started_at?: string | null;
					visit_status?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'visits_exhibition_id_fkey';
						columns: ['exhibition_id'];
						isOneToOne: false;
						referencedRelation: 'exhibitions';
						referencedColumns: ['id'];
					},
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			get_popular_exhibitions: {
				Args: { p_limit?: number };
				Returns: {
					bookmark_count: number;
					exhibition_id: string;
					score: number;
					view_count: number;
				}[];
			};
			is_allowed_web_url: { Args: { raw: string }; Returns: boolean };
			sync_exhibitions_batch: { Args: { p_rows: Json }; Returns: number };
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never) = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never) = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never) = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
	EnumName extends (DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never) = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	public: {
		Enums: {},
	},
} as const;
