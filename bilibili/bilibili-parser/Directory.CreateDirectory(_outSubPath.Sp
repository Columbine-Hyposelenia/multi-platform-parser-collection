Directory.CreateDirectory(_outSubPath.Split('/').First());
                            }
                            _outSubPath = Path.ChangeExtension(_outSubPath, $".{s.lan}.srt");
                            File.Move(s.path, _outSubPath, true);
                        }
                    }
                }

                if (myOption.SubOnly)
                {
                    if (Directory.Exists(p.aid) && Directory.GetFiles(p.aid).Length == 0) Directory.Delete(p.aid, true);
                    return;
                }
            }

            //调用解析
            ParsedResult parsedResult = await ExtractTracksAsync(aidOri, p.aid, p.cid, p.epid, myOption.UseTvApi, myOption.UseIntlApi, myOption.UseAppApi, firstEncoding);
            List<AudioMaterial> audioMaterial = [];
            if (!p.points.Any())
            {
                p.points = parsedResult.ExtraPoints;
            }

            if (Config.DEBUG_LOG)
            {
                File.WriteAllText($"debug_{DateTime.Now:yyyyMMddHHmmssfff}.json", parsedResult.WebJsonString);
            }

            var savePath = "";

            var downloadConfig = new DownloadConfig()
            {
                UseAria2c = myOption.UseAria2c,
                Aria2cArgs = myOption.Aria2cArgs,
                ForceHttp = myOption.ForceHttp,
                MultiThread = myOption.MultiThread,
                RelatedTask = relatedTask,
            };

            //此处代码简直灾难, 后续优化吧
            if ((parsedResult.VideoTracks.Any() || parsedResult.AudioTracks.Any()) && !parsedResult.Clips.Any())   //dash
            {
                if (parsedResult.VideoTracks.Count == 0)
                {
                    LogWarn("没有找到符合要求的视频流");
                    if (myOption.VideoOnly) return;
                }
                if (parsedResult.AudioTracks.Count == 0)
                {
                    LogWarn("没有找到符合要求的音频流");
                    if (myOption.AudioOnly) return;
                }

                if (myOption.AudioOnly)
                {
                    parsedResult.VideoTracks.Clear();
                }
                if (myOption.VideoOnly)
                {
                    parsedResult.AudioTracks.Clear();
                    parsedResult.BackgroundAudioTracks.Clear();
                    parsedResult.RoleAudioList.Clear();
                }

                //排序
                parsedResult.VideoTracks = SortTracks(parsedResult.VideoTracks, dfnPriority, encodingPriority, myOption.VideoAscending);
                parsedResult.AudioTracks = SortTracks(parsedResult.AudioTracks, encodingPriority, myOption.AudioAscending);
                parsedResult.BackgroundAudioTracks = SortTracks(parsedResult.BackgroundAudioTracks, encodingPriority, myOption.AudioAscending);
                foreach (var role in parsedResult.RoleAudioList)
                {
                    role.audio = SortTracks(role.audio, encodingPriority, myOption.AudioAscending);
                }

                //打印轨道信息
                if (!myOption.HideStreams)
                {
                    PrintAllTracksInfo(parsedResult, p.dur, myOption.OnlyShowInfo);
                }

                //仅展示 跳过下载
                if (myOption.OnlyShowInfo)
                {
                    return;
                }

                int vIndex = 0; //用户手动选择的视频序号
                int aIndex = 0; //用户手动选择的音频序号

                //选择轨道
                if (myOption.Interactive && !selected)
                {
                    SelectTrackManually(parsedResult, ref vIndex, ref aIndex);
                    selected = true;
                }

                Video? selectedVideo = parsedResult.VideoTracks.ElementAtOrDefault(vIndex);
                Audio? selectedAudio = parsedResult.AudioTracks.ElementAtOrDefault(aIndex);
                Audio? selectedBackgroundAudio = parsedResult.BackgroundAudioTracks.ElementAtOrDefault(aIndex);

                LogDebug("Format Before: " + savePathFormat);
                savePath = FormatSavePath(savePathFormat, title, selectedVideo, selectedAudio, p, pagesCount, apiType, pubTime);
                LogDebug("Format After: " + savePath);