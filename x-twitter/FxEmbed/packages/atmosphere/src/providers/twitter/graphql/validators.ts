export const validateRetweetersTimelineResponse = (response: unknown): boolean => {
  const r = response as TwitterRetweetersTimelineResponse;
  return Array.isArray(r?.data?.retweeters_timeline?.timeline?.instructions);
};

export const getRetweetersTimelineInstructions = (
  response: unknown
): TimelineInstruction[] | undefined => {
  const r = response as TwitterRetweetersTimelineResponse;
  const instructions = r?.data?.retweeters_timeline?.timeline?.instructions;
  return Array.isArray(instructions) ? instructions : undefined;
};

export const validateAboutAccountQuery = (response: unknown): boolean => {
  const aboutAccountResponse = response as AboutAccountQueryResponse;
  const result = aboutAccountResponse?.data?.user_result_by_screen_name?.result;
  return Boolean(result && typeof result === 'object');
};

export const validateUserProfileAboutQuery = (response: unknown): boolean => {
  const r = response as UserProfileAboutResponse;
  const result =
    r?.data?.user_result_by_rest_id?.result ?? r?.data?.user_rest_result_by_rest_id?.result;
  return Boolean(result && typeof result === 'object');
};

export const validateUserTweetsTimeline = (response: unknown): boolean => {
  const r = response as TwitterUserTweetsResponse;
  return Array.isArray(r?.data?.user?.result?.timeline?.timeline?.instructions);
};

/** UserMedia can return UserTweets-shaped or profile_user_media_timeline-shaped payloads */
export const validateUserMediaTimelineResponse = (response: unknown): boolean => {
  if (validateUserTweetsTimeline(response)) return true;
  const r = response as TwitterProfileTimelineResponse;
  return Array.isArray(
    r?.data?.user_result_by_rest_id?.result?.profile_user_media_timeline?.timeline?.instructions
  );
};

export const validateProfileTimelineResponse = (response: unknown): boolean => {
  const r = response as TwitterProfileTimelineResponse;
  return Array.isArray(
    r?.data?.user_result_by_rest_id?.result?.profile_timeline_v2?.timeline?.instructions
  );
};

export const validateProfileArticlesTimelineResponse = (response: unknown): boolean => {
  const r = response as TwitterProfileTimelineResponse;
  return Array.isArray(
    r?.data?.user_result_by_rest_id?.result?.profile_articles_timeline?.timeline?.instructions
  );
};

export const validateUserArticlesTweetsResponse = validateUserTweetsTimeline;

export const validateProfileWithRepliesTimelineResponse = (response: unknown): boolean => {
  const r = response as TwitterProfileTimelineResponse;
  return Array.isArray(
    r?.data?.user_result_by_rest_id?.result?.profile_with_replies_timeline_v2?.timeline
      ?.instructions
  );
};

export const validateProfileUserPhotoTimelineResponse = (response: unknown): boolean => {
  const r = response as TwitterProfileTimelineResponse;
  return Array.isArray(
    r?.data?.user_result_by_rest_id?.result?.profile_user_photo_timeline?.timeline?.instructions
  );
};

export const validateProfileUserVideoTimelineResponse = (response: unknown): boolean => {
  const r = response as TwitterProfileTimelineResponse;
  return Array.isArray(
    r?.data?.user_result_by_rest_id?.result?.profile_user_video_timeline?.timeline?.instructions
  );
};

export const getProfilePhotoTimelineInstructions = (
  response: unknown
): TimelineInstruction[] | undefined => {
  const r = response as TwitterProfileTimelineResponse;
  const instructions =
    r?.data?.user_result_by_rest_id?.result?.profile_user_photo_timeline?.timeline?.instructions;
  return Array.isArray(instructions) ? instructions : undefined;
};

/** Normalize UserTweets vs ProfileTimeline GraphQL shapes for shared processing */
export const getProfileStatusesTimelineInstructions = (
  response: unknown
): TimelineInstruction[] | undefined => {
  const asUserTweets = response as TwitterUserTweetsResponse;
  const userTweetsPath = asUserTweets?.data?.user?.result?.timeline?.timeline?.instructions;
  if (Array.isArray(userTweetsPath)) {
    return userTweetsPath;
  }
  const asProfile = response as TwitterProfileTimelineResponse;
  const profilePath =
    asProfile?.data?.user_result_by_rest_id?.result?.profile_timeline_v2?.timeline?.instructions;
  if (Array.isArray(profilePath)) {
    return profilePath;
  }
  const profileRepliesPath =
    asProfile?.data?.user_result_by_rest_id?.result?.profile_with_replies_timeline_v2?.timeline
      ?.instructions;
  if (Array.isArray(profileRepliesPath)) {
    return profileRepliesPath;
  }
  const profileVideoPath =
    asProfile?.data?.user_result_by_rest_id?.result?.profile_user_video_timeline?.timeline
      ?.instructions;
  if (Array.isArray(profileVideoPath)) {
    return profileVideoPath;
  }
  const profileMediaPath =
    asProfile?.data?.user_result_by_rest_id?.result?.profile_user_media_timeline?.timeline
      ?.instructions;
  if (Array.isArray(profileMediaPath)) {
    return profileMediaPath;
  }
  return undefined;
};

/** UserArticlesTweets (web) vs ProfileArticlesTimeline (iOS-style by rest_id) */
export const getProfileArticlesTimelineInstructions = (
  response: unknown
): TimelineInstruction[] | undefined => {
  const asUserTweets = response as TwitterUserTweetsResponse;
  const userArticlesPath = asUserTweets?.data?.user?.result?.timeline?.timeline?.instructions;
  if (Array.isArray(userArticlesPath)) {
    return userArticlesPath;
  }
  const asProfile = response as TwitterProfileTimelineResponse;
  const articlesPath =
    asProfile?.data?.user_result_by_rest_id?.result?.profile_articles_timeline?.timeline
      ?.instructions;
  if (Array.isArray(articlesPath)) {
    return articlesPath;
  }
  return undefined;
};

export const validateFollowersByUserIDTimelineResponse = (response: unknown): boolean => {
  const r = response as {
    data?: {
      user_result_by_rest_id?: {
        result?: { followers_timeline?: { timeline?: { instructions?: unknown } } };
      };
    };
  };
  return Array.isArray(
    r?.data?.user_result_by_rest_id?.result?.followers_timeline?.timeline?.instructions
  );
};

export const validateFollowingByUserIDTimelineResponse = (response: unknown): boolean => {
  const r = response as {
    data?: {
      user_result_by_rest_id?: {
        result?: { following_timeline?: { timeline?: { instructions?: unknown } } };
      };
    };
  };
  return Array.isArray(
    r?.data?.user_result_by_rest_id?.result?.following_timeline?.timeline?.instructions
  );
};

/** Followers/Following: userId queries share UserTweets timeline path; ByUserID uses *_timeline under user_result_by_rest_id */
export const getFollowersFollowingInstructions = (
  response: unknown,
  kind: 'followers' | 'following'
): TimelineInstruction[] | undefined => {
  if (validateUserTweetsTimeline(response)) {
    const uwt = response as TwitterUserTweetsResponse;
    return (uwt.data?.user?.result?.timeline?.timeline?.instructions ??
      []) as TimelineInstruction[];
  }
  const r = response as {
    data?: {
      user_result_by_rest_id?: {
        result?: {
          followers_timeline?: { timeline?: { instructions?: TimelineInstruction[] } };
          following_timeline?: { timeline?: { instructions?: TimelineInstruction[] } };
        };
      };
    };
  };
  const instructions =
    kind === 'followers'
      ? r?.data?.user_result_by_rest_id?.result?.followers_timeline?.timeline?.instructions
      : r?.data?.user_result_by_rest_id?.result?.following_timeline?.timeline?.instructions;
  return Array.isArray(instructions) ? instructions : undefined;
};
