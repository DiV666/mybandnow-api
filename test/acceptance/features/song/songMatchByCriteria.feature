@song
Feature: List songs by criteria
  In order to browse the songs I can access
  As an authenticated musician
  I want to list only the songs that belong to my bands

  Background:
    Given An "accessibleBandId" parameter with value as "string":
    """
    $uuid
    """
    And An "secondAccessibleBandId" parameter with value as "string":
    """
    $uuid
    """
    And An "inaccessibleBandId" parameter with value as "string":
    """
    $uuid
    """
    And An "ownerId" parameter with value as "string":
    """
    $uuid
    """
    And An "secondOwnerId" parameter with value as "string":
    """
    $uuid
    """
    And An "memberId" parameter with value as "string":
    """
    $uuid
    """
    And An "outsiderOwnerId" parameter with value as "string":
    """
    $uuid
    """
    And An "outsiderMemberId" parameter with value as "string":
    """
    $uuid
    """
    And An "accessibleSongId" parameter with value as "string":
    """
    $uuid
    """
    And An "secondAccessibleSongId" parameter with value as "string":
    """
    $uuid
    """
    And An "inaccessibleSongId" parameter with value as "string":
    """
    $uuid
    """
    And A musician exists with id "#ownerId", user id "#ownerId", and username "song-owner"
    And A musician exists with id "#secondOwnerId", user id "#secondOwnerId", and username "song-second-owner"
    And A musician exists with id "#memberId", user id "#memberId", and username "song-member"
    And A musician exists with id "#outsiderOwnerId", user id "#outsiderOwnerId", and username "song-outsider-owner"
    And A musician exists with id "#outsiderMemberId", user id "#outsiderMemberId", and username "song-outsider-member"
    And An existing band with id "#accessibleBandId", owner "#ownerId", and member "#memberId"
    And An existing band with id "#secondAccessibleBandId", owner "#secondOwnerId", and member "#memberId"
    And An existing band with id "#inaccessibleBandId", owner "#outsiderOwnerId", and member "#outsiderMemberId"
    And An existing song with id "#accessibleSongId", band "#accessibleBandId", and title "Alpha Song"
    And An existing song with id "#secondAccessibleSongId", band "#secondAccessibleBandId", and title "Beta Song"
    And An existing song with id "#inaccessibleSongId", band "#inaccessibleBandId", and title "Hidden Song"

  Scenario: A musician lists the songs from their bands using criteria
    Given I authenticate as user "song-member" with id "#memberId"
    When I send a GET request to "/v1/songs?criteria=%7B%22order%22%3A%7B%22orderBy%22%3A%22title%22%2C%22orderType%22%3A%22asc%22%7D%2C%22limit%22%3A10%2C%22offset%22%3A0%7D"
    Then the response status code should be 200
    And the response should be:
      """
      {
        "items": [
          {
            "id": "#accessibleSongId",
            "bandId": "#accessibleBandId",
            "title": "Alpha Song",
            "originalVideoclipUrl": "https://cdn.example.com/original.mp4"
          },
          {
            "id": "#secondAccessibleSongId",
            "bandId": "#secondAccessibleBandId",
            "title": "Beta Song",
            "originalVideoclipUrl": "https://cdn.example.com/original.mp4"
          }
        ],
        "total": 2
      }
      """

  Scenario: The musician only receives songs from their own bands even when criteria targets another band
    Given I authenticate as user "song-member" with id "#memberId"
    When I send a GET request to "/v1/songs?criteria=%7B%22filters%22%3A%5B%7B%22field%22%3A%22bandId%22%2C%22operator%22%3A%22EQUAL%22%2C%22type%22%3A%22string%22%2C%22value%22%3A%22#inaccessibleBandId%22%7D%5D%7D"
    Then the response status code should be 200
    And the response should be:
      """
      {
        "items": [],
        "total": 0
      }
      """

  Scenario: An authenticated user without a musician profile cannot list songs
    Given An authenticated user "songs-no-profile" with password "asdASD123!"
    When I send a GET request to "/v1/songs"
    Then the response status code should be 403
    And the response should be:
      """
      {
        "code": "FORBIDDEN",
        "message": "Profile required"
      }
      """
